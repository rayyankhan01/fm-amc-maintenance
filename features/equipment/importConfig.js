export function getImportLimit(value = process.env.ASSET_IMPORT_LIMIT) {
  if (value == null || value.trim() === "") return 200;
  const normalized = value.trim();
  const limit = Number(normalized);
  if (!/^[1-9]\d*$/.test(normalized) || !Number.isSafeInteger(limit)) {
    throw new Error("ASSET_IMPORT_LIMIT must be a positive whole number.");
  }
  return limit;
}