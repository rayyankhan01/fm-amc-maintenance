export const IMPORT_COLUMNS = [
  "Asset Category",
  "Asset Type",
  "Asset Type Code",
  "Asset Name",
  "Site Code",
  "Room/Area",
  "Asset Status",
  "AMC Preventive Maintenance Frequency",
  "AMC Date [YYYY-MM-DD]",
  "Capacity/Type",
  "Refill Date CO2 [YYYY-MM-DD]",
  "Refill Date DCP [YYYY-MM-DD]",
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

function fieldValue(label, value) {
  return `${label} [${normalized(value) || "empty"}]`;
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
  const invalidIndex = row.findIndex((value) => typeof value !== "string" && typeof value !== "number" && value != null);
  if (invalidIndex !== -1) {
    return { error: `${fieldValue(IMPORT_COLUMNS[invalidIndex], row[invalidIndex])} has an invalid cell value.` };
  }
  const cells = row.map(normalized);
  for (const index of [9, 10, 11]) {
    if (cells[index] === "-") cells[index] = "";
  }
  const longIndex = cells.findIndex((value) => value.length > 255);
  if (longIndex !== -1) return { error: `${fieldValue(IMPORT_COLUMNS[longIndex], cells[longIndex])} must not exceed 255 characters.` };
  const [category, equipmentType, typeCode, name, siteCode, roomArea, statusCode, frequencyCode, amcDate, capacity, refillCo2, refillDcp] = cells;
  const missingFields = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((index) => !cells[index]);
  if (missingFields.length) {
    return { error: `${missingFields.map((index) => fieldValue(IMPORT_COLUMNS[index], cells[index])).join(", ")} required.` };
  }
  const categoryType = lookups.types.find((item) => normalizedKey(item.name) === normalizedKey(category));
  if (!categoryType) return { error: `${fieldValue("Asset Category", category)} does not exist or is inactive. Add the category first.` };
  const type = lookups.types.find((item) => normalizedTypeCode(item.code) === normalizedTypeCode(equipmentType));
  if (!type) {
    const categoryCodes = lookups.types
      .filter((item) => normalizedKey(item.name) === normalizedKey(category))
      .map((item) => JSON.stringify(item.code))
      .join(", ");
    return { error: `${fieldValue("Asset Type", equipmentType)} does not match an active code. Active code(s) for ${fieldValue("Asset Category", category)}: ${categoryCodes}.` };
  }
  if (normalizedKey(categoryType.name) !== normalizedKey(type.name)) {
    return { error: `${fieldValue("Asset Category", category)} and ${fieldValue("Asset Type", equipmentType)} must refer to the same equipment type.` };
  }
  const assetTypeCode = lookups.typeCodes.find((item) => normalizedTypeCode(item.code) === normalizedTypeCode(typeCode));
  if (!assetTypeCode) return { error: `${fieldValue("Asset Type Code", typeCode)} does not exist. Add the code first.` };
  const matchingSites = lookups.locations.filter((item) => normalizedKey(item.site_code) === normalizedKey(siteCode));
  if (!matchingSites.length) return { error: `${fieldValue("Site Code", siteCode)} does not exist. Add the site first.` };
  const location = matchingSites.find((item) => normalizedKey(item.room_area) === normalizedKey(roomArea)) ?? matchingSites[0];
  const status = lookups.statuses.find((item) => normalizedKey(item.code) === normalizedKey(statusCode));
  if (!status) return { error: `${fieldValue("Asset Status", statusCode)} does not exist or is inactive. Add the status first.` };
  const frequency = lookups.frequencies.find((item) => normalizedKey(item.code) === normalizedKey(frequencyCode));
  if (!frequency) return { error: `${fieldValue("AMC Preventive Maintenance Frequency", frequencyCode)} does not exist or is inactive. Add the frequency first.` };
  if (!Number.isInteger(frequency.interval_days) || frequency.interval_days <= 0) return { error: `${fieldValue("AMC Preventive Maintenance Frequency", frequencyCode)} must have a positive interval in days.` };
  if (!isValidDate(amcDate)) return { error: `${fieldValue("AMC Date", amcDate)} must be a valid date in YYYY-MM-DD format.` };
  if (refillCo2 && !isValidDate(refillCo2)) return { error: `${fieldValue("Refill Date CO2", refillCo2)} must be a valid date in YYYY-MM-DD format.` };
  if (refillDcp && !isValidDate(refillDcp)) return { error: `${fieldValue("Refill Date DCP", refillDcp)} must be a valid date in YYYY-MM-DD format.` };
  const typeName = type.name?.trim().toLowerCase();
  const code = type.code.trim().toUpperCase();
  const isExtinguisher = typeName === "fire extinguisher" || code === "FE";
  const hasCapacity = ["fet", "fp", "ac"].includes(normalizedTypeCode(equipmentType));
  if ((refillCo2 || refillDcp) && !isExtinguisher) {
    const refillValues = [refillCo2 && fieldValue("Refill Date CO2", refillCo2), refillDcp && fieldValue("Refill Date DCP", refillDcp)].filter(Boolean);
    return { error: `${refillValues.join(", ")} only available for fire extinguishers; ${fieldValue("Asset Type", equipmentType)} is not a fire extinguisher.` };
  }
  if (capacity && !hasCapacity) return { error: `${fieldValue("Capacity/Type", capacity)} is only available for Asset Types FET, FP, and AC; received ${fieldValue("Asset Type", equipmentType)}.` };
  return {
    value: {
      equipment_type_id: type.id,
      equipment_type: type.code,
      equipment_type_code: assetTypeCode.code.trim().toUpperCase(),
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