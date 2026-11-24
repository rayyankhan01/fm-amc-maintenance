export const IMPORT_COLUMNS = [
  "Asset Category Code",
  "Asset Type",
  "Asset Type Code",
  "Asset Name",
  "Site",
  "Room/Area",
  "Status Code",
  "AMC Frequency Code",
  "AMC Date",
  "Capacity/Type",
  "Refill Date CO2",
  "Refill Date DCP",
];

export const IMPORT_LIMIT = 200;

export function importAssetKey(typeCode, unitNumber) {
  return `${String(typeCode ?? "").trim().toUpperCase()}|${Number(unitNumber)}`;
}

function normalized(value) {
  return String(value ?? "").trim();
}

function normalizedKey(value) {
  return normalized(value).toLowerCase();
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateImportRow(row, lookups) {
  if (!Array.isArray(row) || row.length !== IMPORT_COLUMNS.length) {
    return { error: "Invalid row format." };
  }
  if (row.some((value) => typeof value !== "string" && typeof value !== "number" && value != null)) {
    return { error: "Invalid cell value." };
  }
  const cells = row.map(normalized);
  for (const index of [9, 10, 11]) {
    if (cells[index] === "-") cells[index] = "";
  }
  if (cells.some((value) => value.length > 255)) return { error: "Cell values must not exceed 255 characters." };
  const [categoryCode, equipmentType, typeCode, name, siteCode, roomArea, statusCode, frequencyCode, amcDate, capacity, refillCo2, refillDcp] = cells;
  if (![categoryCode, equipmentType, typeCode, name, siteCode, roomArea, statusCode, frequencyCode, amcDate].every(Boolean)) {
    return { error: "Complete all required columns." };
  }
  const type = lookups.types.find((item) => item.code.toLowerCase() === categoryCode.toLowerCase());
  if (!type) return { error: "Unknown or inactive asset category code." };
  if (normalizedKey(equipmentType) !== normalizedKey(type.name)) {
    return { error: `Asset Type must match the category name for ${type.code} (${type.name}).` };
  }
  const location = lookups.locations.find((item) =>
    normalizedKey(item.site_code) === normalizedKey(siteCode)
    && normalizedKey(item.room_area) === normalizedKey(roomArea),
  );
  if (!location) return { error: "Site and Room/Area must match an existing location." };
  const status = lookups.statuses.find((item) => item.code.toLowerCase() === statusCode.toLowerCase());
  if (!status) return { error: "Unknown or inactive status code." };
  const frequency = lookups.frequencies.find((item) => item.code.toLowerCase() === frequencyCode.toLowerCase());
  if (!frequency?.interval_days) return { error: "Unknown or inactive frequency, or frequency has no interval." };
  if (!isValidDate(amcDate) || (refillCo2 && !isValidDate(refillCo2)) || (refillDcp && !isValidDate(refillDcp))) {
    return { error: "Dates must be valid and use YYYY-MM-DD." };
  }
  const typeName = type.name?.trim().toLowerCase();
  const code = type.code.trim().toUpperCase();
  const isExtinguisher = typeName === "fire extinguisher" || code === "FE";
  const hasCapacity = ["AC", "FET", "FP&WT"].includes(code) || typeName === "ac";
  if ((refillCo2 || refillDcp) && !isExtinguisher) return { error: "Refill dates are only available for fire extinguishers." };
  if (capacity && !hasCapacity) return { error: "Capacity/Type is not available for this asset category." };
  return {
    value: {
      equipment_type_id: type.id,
      equipment_type: type.code,
      equipment_type_code: typeCode.toUpperCase(),
      name,
      site_code: location.site_code,
      site_name: location.site_name,
      room_area: roomArea,
      status: status.code,
      amc_frequency: frequency.code,
      amc_date: amcDate,
      capacity_type: capacity,
      refill_date_co2: refillCo2,
      refill_date_dcp: refillDcp,
    },
  };
}