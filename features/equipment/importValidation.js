export const IMPORT_COLUMNS = [
  "Asset Category",
  "Asset Type",
  "Asset Type Code",
  "Asset Id",
  "Site",
  "Room/Area",
  "Asset Status",
  "AMC Preventive Maintenance Frequency",
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

function normalizedTypeCode(value) {
  return normalized(value).normalize("NFKC").replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
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
  const [category, equipmentType, typeCode, name, siteCode, roomArea, statusCode, frequencyCode, amcDate, capacity, refillCo2, refillDcp] = cells;
  if (![category, equipmentType, typeCode, name, siteCode, roomArea, statusCode, frequencyCode, amcDate].every(Boolean)) {
    return { error: "Complete all required columns." };
  }
  const categoryType = lookups.types.find((item) => normalizedKey(item.name) === normalizedKey(category));
  if (!categoryType) return { error: "Asset category does not exist or is inactive. Add the category first." };
  const type = lookups.types.find((item) => normalizedTypeCode(item.code) === normalizedTypeCode(equipmentType));
  if (!type) {
    const categoryCodes = lookups.types
      .filter((item) => normalizedKey(item.name) === normalizedKey(category))
      .map((item) => JSON.stringify(item.code))
      .join(", ");
    return { error: `Asset Type ${JSON.stringify(equipmentType)} does not match an active code. Active code(s) for ${JSON.stringify(category)}: ${categoryCodes}.` };
  }
  if (normalizedKey(categoryType.name) !== normalizedKey(type.name)) {
    return { error: "Asset Category and Asset Type must refer to the same equipment type." };
  }
  if (lookups.names.has(normalizedKey(name))) return { error: "Asset Name already exists. Enter a unique asset name." };
  const matchingSites = lookups.locations.filter((item) => normalizedKey(item.site_code) === normalizedKey(siteCode));
  if (!matchingSites.length) return { error: "Site code does not exist. Add the site first." };
  const location = matchingSites.find((item) => normalizedKey(item.room_area) === normalizedKey(roomArea)) ?? matchingSites[0];
  const status = lookups.statuses.find((item) => normalizedKey(item.code) === normalizedKey(statusCode));
  if (!status) return { error: "Asset status does not exist or is inactive. Add the status first." };
  const frequency = lookups.frequencies.find((item) => normalizedKey(item.code) === normalizedKey(frequencyCode));
  if (!frequency) return { error: "Frequency code does not exist or is inactive. Add the frequency first." };
  if (!Number.isInteger(frequency.interval_days) || frequency.interval_days <= 0) return { error: "Frequency must have a positive interval in days." };
  if (!isValidDate(amcDate)) return { error: "AMC Date must be a valid date in YYYY-MM-DD format." };
  if (refillCo2 && !isValidDate(refillCo2)) return { error: "Refill Date CO2 must be a valid date in YYYY-MM-DD format." };
  if (refillDcp && !isValidDate(refillDcp)) return { error: "Refill Date DCP must be a valid date in YYYY-MM-DD format." };
  const typeName = type.name?.trim().toLowerCase();
  const code = type.code.trim().toUpperCase();
  const isExtinguisher = typeName === "fire extinguisher" || code === "FE";
  const hasCapacity = code === "AC" || typeName === "ac";
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