const test = require("node:test");
const assert = require("node:assert/strict");
const { validateImportRow, validateImportRows, importAssetKey, IMPORT_COLUMNS } = require("./importValidation.js");
const { createEquipmentImportBatch, getNextUnitNumber, isEquipmentImportBatchOwner } = require("./api.js");
const { importErrorDetails } = require("../../lib/userError.js");
const { getImportLimit } = require("./importConfig.js");

const lookups = {
  types: [
    { id: "ac-id", code: "AC", name: "Air Conditioner" },
    { id: "fe-id", code: "FE", name: "Fire Extinguisher" },
    { id: "sd-id", code: "SD", name: "Smoke Detector" },
    { id: "fet-id", code: "FET", name: "Fire Extinguisher Trolley Points" },
    { id: "fp-id", code: "FP&WT", name: "Fire Pump & Water Tank" },
  ],
  statuses: [{ code: "OPERATIONAL" }],
  frequencies: [{ code: "MONTHLY", interval_days: 30 }],
  locations: [{ site_code: "W3", site_name: "Warsan", room_area: "Room 1" }],
};
const valid = ["Air Conditioner", "AC", "AC", "Split AC", "W3", "Room 1", "OPERATIONAL", "MONTHLY", "2026-02-28", "1.5 TON", "", ""];

test("import limit uses a positive whole-number environment setting", () => {
  assert.equal(getImportLimit(""), 200);
  assert.equal(getImportLimit(" 350 "), 350);
  for (const value of ["0", "-1", "1.5", "abc", "9007199254740992"]) {
    assert.throws(() => getImportLimit(value), /ASSET_IMPORT_LIMIT/);
  }
});

test("validates every spreadsheet row before importing", () => {
  const invalid = [...valid];
  invalid[4] = "Unknown";
  const rows = Array.from({ length: 11 }, (_, index) => ({ rowNumber: index + 2, values: index === 10 ? invalid : [...valid] }));
  const result = validateImportRows(rows, lookups);
  assert.equal(result.assets.length, 0);
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].row, 12);
  assert.match(result.errors[0].message, /Site Code \[Unknown\]/);
  const validResult = validateImportRows(rows.slice(0, 10), lookups);
  assert.equal(validResult.assets.length, 10);
  assert.deepEqual(validResult.errors, []);
});

test("import errors include application and database details", () => {
  assert.equal(importErrorDetails(new Error("Site Name already uses another Site Location.")), "Site Name already uses another Site Location.");
  assert.equal(importErrorDetails({ message: "duplicate key", code: "23505", details: "Key already exists.", hint: "Use a different value." }), "duplicate key Code: 23505 Details: Key already exists. Hint: Use a different value.");
  assert.equal(importErrorDetails(null), "Unable to complete the import.");
});

test("template validates category, asset type and site code", () => {
  assert.equal(IMPORT_COLUMNS.length, valid.length);
  assert.equal(IMPORT_COLUMNS[3], "Asset Name");
  assert.equal(IMPORT_COLUMNS[4], "Site Code");
  assert.equal(IMPORT_COLUMNS[8], "AMC Date [YYYY-MM-DD]");
  assert.equal(IMPORT_COLUMNS[10], "Refill Date CO2 [YYYY-MM-DD]");
  assert.equal(IMPORT_COLUMNS[11], "Refill Date DCP [YYYY-MM-DD]");
  const result = validateImportRow(valid, lookups);
  assert.equal(result.value.capacity_type, "1.5 TON");
  assert.equal(result.value.equipment_type_id, "ac-id");
  assert.equal(result.value.equipment_type, "AC");
  assert.equal(result.value.site_code, "W3");
  assert.equal(result.value.site_name, "Warsan");
  assert.equal(result.value.unit_number, undefined);
});

test("uses Asset Type when Asset Type Code is blank", () => {
  const row = [...valid];
  row[2] = " new-code ";
  assert.equal(validateImportRow(row, lookups).value.equipment_type_code, "NEW-CODE");
  for (const value of ["", " "]) {
    row[2] = value;
    assert.equal(validateImportRow(row, lookups).value.equipment_type_code, "AC");
  }
});

test("matches a multiword asset type code despite copied spreadsheet whitespace", () => {
  const row = [...valid];
  row[0] = "Fire Extinguisher";
  row[9] = "";
  const types = [...lookups.types.filter((type) => type.id !== "fe-id"), { id: "fe-id", code: "FIRE POINT", name: "Fire Extinguisher" }];
  for (const code of ["FIRE POINT", " fire\u00a0  point\u200b "]) {
    row[1] = code;
    const result = validateImportRow(row, { ...lookups, types });
    assert.equal(result.value.equipment_type_id, "fe-id");
    assert.equal(result.value.equipment_type, "FIRE POINT");
  }
});

test("validates category, type, status and frequency against configuration", () => {
  for (const [index, value, message] of [
    [0, "Unknown", /Add the category/],
    [1, "Unknown", /Asset Type \[Unknown\] does not match an active code.*"AC"/],
    [1, "SD", /same equipment type/],
    [6, "Unknown", /Add the status/],
    [7, "Unknown", /Add the frequency/],
  ]) {
    const row = [...valid];
    row[index] = value;
    assert.match(validateImportRow(row, lookups).error, message);
  }
  assert.match(validateImportRow(valid, { ...lookups, frequencies: [{ code: "MONTHLY", interval_days: 0 }] }).error, /positive interval/);
});

test("accepts repeated asset names while keeping the name required", () => {
  const row = [...valid];
  const existingNameLookups = { ...lookups, names: new Set(["existing asset"]) };
  row[3] = " Existing Asset ";
  assert.equal(validateImportRow(row, existingNameLookups).value.name, "Existing Asset");
  row[3] = "existing asset";
  assert.equal(validateImportRow(row, existingNameLookups).value.name, "existing asset");
  row[3] = " ";
  assert.match(validateImportRow(row, lookups).error, /Asset Name \[empty\].*required/);
});

test("row validation errors include the offending field values", () => {
  for (const [index, value, expected] of [
    [0, "Unknown category", "Asset Category [Unknown category]"],
    [1, "Unknown type", "Asset Type [Unknown type]"],
    [4, "Unknown site", "Site Code [Unknown site]"],
    [5, "", "Room/Area [empty]"],
    [6, "Unknown status", "Asset Status [Unknown status]"],
    [7, "Unknown frequency", "AMC Preventive Maintenance Frequency [Unknown frequency]"],
    [8, "2026-02-30", "AMC Date [2026-02-30]"],
    [10, "2026-02-30", "Refill Date CO2 [2026-02-30]"],
    [11, "2026-02-30", "Refill Date DCP [2026-02-30]"],
  ]) {
    const row = [...valid];
    row[index] = value;
    assert.ok(validateImportRow(row, lookups).error.includes(expected), IMPORT_COLUMNS[index]);
  }
  const capacityRow = [...valid];
  capacityRow[0] = "Smoke Detector";
  capacityRow[1] = "SD";
  assert.match(validateImportRow(capacityRow, lookups).error, /Capacity\/Type \[1\.5 TON\].*Asset Category \[Smoke Detector\]/);
  const refillRow = [...valid];
  refillRow[10] = "2026-02-28";
  assert.match(validateImportRow(refillRow, lookups).error, /Refill Date CO2 \[2026-02-28\].*Asset Type \[AC\]/);
});

test("resolves existing site codes even when site names are shared", () => {
  const row = [...valid];
  row[4] = " w4 ";
  row[5] = "Room 2";
  const sharedName = { ...lookups, locations: [...lookups.locations, { site_code: "W4", site_name: "Warsan", room_area: "Room 3" }] };
  const result = validateImportRow(row, sharedName);
  assert.equal(result.value.site_code, "W4");
  assert.equal(result.value.site_name, "Warsan");
  assert.equal(result.value.room_area, "Room 2");
  row[4] = "Unknown";
  assert.match(validateImportRow(row, sharedName).error, /Site Code \[Unknown\] does not exist/);
  row[4] = "Warsan";
  assert.match(validateImportRow(row, sharedName).error, /Site Code \[Warsan\] does not exist/);
});

test("validates AMC and refill dates individually", () => {
  const missingDate = [...valid];
  missingDate[8] = "";
  assert.match(validateImportRow(missingDate, lookups).error, /required/);
  for (const [index, message] of [[8, /AMC Date/], [10, /Refill Date CO2/], [11, /Refill Date DCP/]]) {
    const row = [...valid];
    row[index] = "2026-02-30";
    assert.match(validateImportRow(row, lookups).error, message);
  }
  const row = [...valid];
  row[0] = "Fire Extinguisher";
  row[1] = "FE";
  row[9] = "-";
  row[10] = "2024-02-29";
  row[11] = "2026-11-21";
  const result = validateImportRow(row, lookups);
  assert.equal(result.value.capacity_type, "");
  assert.equal(result.value.refill_date_co2, "2024-02-29");
  assert.equal(result.value.refill_date_dcp, "2026-11-21");
});

test("capacity is only accepted for the permitted Asset Categories", () => {
  const row = [...valid];
  row[2] = "SD";
  for (const [category, type] of [["Fire Extinguisher Trolley Points", "FET"], ["Fire Pump & Water Tank", "FP&WT"], [" air conditioner ", " ac "]]) {
    row[0] = category;
    row[1] = type;
    assert.equal(validateImportRow(row, lookups).value.capacity_type, "1.5 TON");
  }
  row[0] = "Air Conditioner";
  row[1] = "COOLING";
  const alternateType = { ...lookups, types: [...lookups.types, { id: "cooling-id", code: "COOLING", name: "Air Conditioner" }] };
  assert.equal(validateImportRow(row, alternateType).value.capacity_type, "1.5 TON");
  row[0] = "Smoke Detector";
  row[1] = "SD";
  row[2] = "AC";
  assert.match(validateImportRow(row, lookups).error, /Capacity\/Type/);
  row[9] = "";
  assert.equal(validateImportRow(row, lookups).value.equipment_type_code, "AC");
  row[2] = "OLD";
  assert.equal(validateImportRow(row, lookups).value.equipment_type_code, "OLD");
});

test("refill dates are only accepted for extinguishers", () => {
  const row = [...valid];
  row[10] = "2026-02-28";
  assert.match(validateImportRow(row, lookups).error, /only available for fire extinguishers/);
});

test("required cells and duplicate asset keys are checked", () => {
  const row = [...valid];
  row[3] = "";
  assert.match(validateImportRow(row, lookups).error, /required/);
  const existing = new Set([importAssetKey("SPAC", 1)]);
  assert.ok(existing.has(importAssetKey(" spac ", "01")));
  assert.ok(!existing.has(importAssetKey("SPAC", 2)));
});

test("next unit number follows the highest existing number for the type", async () => {
  const records = [{ equipment_type_code: "AC", unit_number: 4 }, { equipment_type_code: "AC", unit_number: 8 }, { equipment_type_code: "FE", unit_number: 20 }];
  const supabase = {
    from(table) {
      assert.equal(table, "equipment");
      return {
        select(column) { assert.equal(column, "unit_number"); return this; },
        eq(column, value) { assert.equal(column, "equipment_type_code"); this.code = value; return this; },
        order(column, options) { assert.equal(column, "unit_number"); assert.equal(options.ascending, false); return this; },
        limit(count) { assert.equal(count, 1); return this; },
        async maybeSingle() {
          const matching = records.filter((record) => record.equipment_type_code === this.code);
          return { data: matching.sort((left, right) => right.unit_number - left.unit_number)[0] ?? null, error: null };
        },
      };
    },
  };
  assert.equal(await getNextUnitNumber(supabase, "AC"), 9);
  assert.equal(await getNextUnitNumber(supabase, "FE"), 21);
  assert.equal(await getNextUnitNumber(supabase, "FP"), 1);
});

test("import batch numbers are allocated once and checked against their owner", async () => {
  const batches = [];
  const supabase = {
    from(table) {
      assert.equal(table, "equipment_import_batches");
      return {
        insert(values) { this.values = values; return this; },
        select(column) { assert.equal(column, "batch_no"); return this; },
        eq(column, value) { this.filters ??= {}; this.filters[column] = value; return this; },
        async single() {
          const batch = { batch_no: batches.length + 1, ...this.values };
          batches.push(batch);
          return { data: batch, error: null };
        },
        async maybeSingle() {
          return { data: batches.find((batch) => batch.batch_no === this.filters.batch_no && batch.created_by === this.filters.created_by) ?? null, error: null };
        },
      };
    },
  };
  const firstBatch = await createEquipmentImportBatch(supabase, "admin-1");
  const secondBatch = await createEquipmentImportBatch(supabase, "admin-2");
  assert.equal(firstBatch, 1);
  assert.equal(secondBatch, 2);
  assert.equal(await isEquipmentImportBatchOwner(supabase, firstBatch, "admin-1"), true);
  assert.equal(await isEquipmentImportBatchOwner(supabase, firstBatch, "admin-2"), false);
  assert.equal(await isEquipmentImportBatchOwner(supabase, 99, "admin-1"), false);
  assert.equal(await isEquipmentImportBatchOwner(supabase, "1", "admin-1"), false);
});

