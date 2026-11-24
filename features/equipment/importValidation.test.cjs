const test = require("node:test");
const assert = require("node:assert/strict");
const { validateImportRow, importAssetKey, IMPORT_COLUMNS } = require("./importValidation.js");

const lookups = {
  types: [
    { id: "ac-id", code: "AC", name: "Air Conditioner" },
    { id: "fe-id", code: "FE", name: "Fire Extinguisher" },
    { id: "sd-id", code: "SD", name: "Smoke Detector" },
    { id: "fet-id", code: "FET", name: "Fire Equipment" },
  ],
  statuses: [{ code: "OPERATIONAL" }],
  frequencies: [{ code: "MONTHLY", interval_days: 30 }],
  locations: [{ site_code: "W3", site_name: "Warsan", room_area: "Room 1" }],
  names: new Set(["existing asset"]),
};
const valid = ["Air Conditioner", "AC", "SPAC", "Split AC", "W3", "Room 1", "OPERATIONAL", "MONTHLY", "2026-02-28", "1.5 TON", "", ""];

test("template validates category name, type code and site code", () => {
  assert.equal(IMPORT_COLUMNS.length, valid.length);
  const result = validateImportRow(valid, lookups);
  assert.equal(result.value.capacity_type, "1.5 TON");
  assert.equal(result.value.equipment_type_id, "ac-id");
  assert.equal(result.value.equipment_type, "AC");
  assert.equal(result.value.site_code, "W3");
  assert.equal(result.value.site_name, "Warsan");
  assert.equal(result.value.unit_number, undefined);
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
    [1, "Unknown", /Asset Type "Unknown" does not match an active code.*"AC"/],
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

test("rejects duplicate names ignoring case and whitespace", () => {
  const row = [...valid];
  row[3] = " Existing Asset ";
  assert.match(validateImportRow(row, lookups).error, /already exists/);
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
  assert.match(validateImportRow(row, sharedName).error, /Site code does not exist/);
  row[4] = "Warsan";
  assert.match(validateImportRow(row, sharedName).error, /Site code does not exist/);
});

test("validates AMC and refill dates individually", () => {
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

test("capacity is only accepted for AC and refill dates only for extinguishers", () => {
  const row = [...valid];
  row[0] = "Fire Equipment";
  row[1] = "FET";
  assert.match(validateImportRow(row, lookups).error, /Capacity\/Type/);
  row[0] = "Air Conditioner";
  row[1] = "AC";
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

