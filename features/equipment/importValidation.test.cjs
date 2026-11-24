const test = require("node:test");
const assert = require("node:assert/strict");
const { validateImportRow, importAssetKey, IMPORT_COLUMNS } = require("./importValidation.js");

const lookups = {
  types: [
    { id: "ac-id", code: "AC", name: "Air Conditioner" },
    { id: "fe-id", code: "FE", name: "Fire Extinguisher" },
    { id: "sd-id", code: "SD", name: "Smoke Detector" },
  ],
  statuses: [{ code: "OPERATIONAL" }],
  frequencies: [{ code: "MONTHLY", interval_days: 30 }],
  locations: [
    { site_code: "W3", site_name: "Warsan" },
    { site_code: "JAFZA", site_name: "JAFZA" },
  ],
};
const valid = ["AC", "Air Conditioner", "SPAC", "1", "Split AC", "W3", "Warsan", "Room 1", "OPERATIONAL", "MONTHLY", "2026-02-28", "1.5 TON", "", ""];

test("template matches the validator and permits capacity for AC", () => {
  assert.equal(IMPORT_COLUMNS.length, valid.length);
  const result = validateImportRow(valid, lookups);
  assert.equal(result.value.capacity_type, "1.5 TON");
  assert.equal(result.value.unit_number, 1);
  assert.equal(result.value.equipment_type_id, "ac-id");
  assert.equal(result.value.site_code, "W3");
  assert.equal(result.value.site_name, "Warsan");
});

test("accepts the screenshot date and treats a dash as empty optional capacity", () => {
  const row = [...valid];
  row[0] = "SD";
  row[1] = "Smoke Detector";
  row[10] = "2026-11-21";
  row[11] = "-";
  const result = validateImportRow(row, lookups);
  assert.equal(result.value.amc_date, "2026-11-21");
  assert.equal(result.value.capacity_type, "");
});

test("refill dates require an extinguisher", () => {
  const row = [...valid];
  row[12] = "2026-02-28";
  assert.match(validateImportRow(row, lookups).error, /only available for fire extinguishers/);
  row[0] = "FE";
  row[1] = "Fire Extinguisher";
  row[11] = "";
  assert.equal(validateImportRow(row, lookups).value.refill_date_co2, "2026-02-28");
});

test("capacity is rejected for unsupported categories", () => {
  const row = [...valid];
  row[0] = "SD";
  row[1] = "Smoke Detector";
  assert.match(validateImportRow(row, lookups).error, /not available/);
});

test("duplicate keys ignore case, whitespace, and leading zeroes", () => {
  const existing = new Set([importAssetKey("SPAC", 1)]);
  assert.ok(existing.has(importAssetKey(" spac ", "01")));
  assert.ok(!existing.has(importAssetKey("SPAC", 2)));
  assert.ok(!existing.has(importAssetKey("FE", 1)));
});

test("required fields, dates, unit numbers and lookup values are checked", () => {
  for (const [index, value] of [[4, ""], [10, "2026-02-30"], [3, "0"], [8, "UNKNOWN"], [9, "UNKNOWN"], [0, "UNKNOWN"]]) {
    const row = [...valid];
    row[index] = value;
    assert.ok(validateImportRow(row, lookups).error, `column ${IMPORT_COLUMNS[index]}`);
  }
});

test("Asset Type must match the category name in the database", () => {
  const row = [...valid];
  row[1] = "Air Conditioning";
  assert.match(validateImportRow(row, lookups).error, /Asset Type must match/);
});

test("Site and Site Name must match an existing database pair", () => {
  const row = [...valid];
  row[5] = "W3";
  row[6] = "JAFZA";
  assert.match(validateImportRow(row, lookups).error, /must match an existing site/);

  row[5] = "w3";
  row[6] = " warsan ";
  const result = validateImportRow(row, lookups);
  assert.equal(result.value.site_code, "W3");
  assert.equal(result.value.site_name, "Warsan");
});