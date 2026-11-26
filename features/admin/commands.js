"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { userError } from "@/lib/userError";
import {
  importAssetKey,
  validateImportRow,
} from "@/features/equipment/importValidation";
import { ASSET_NAME_CATEGORIES } from "@/features/equipment/assetNameCategories";

async function requireAdmin() {
  await requireRole(["admin"]);
  return createAdminClient();
}

function required(value, label) {
  const normalized = String(value ?? "").trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function toPascalDisplay(value, label) {
  return required(value, label)
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

const USER_ROLES = ["admin", "engineer", "technician"];

function requiredUserRole(value) {
  const role = required(value, "Role");
  if (!USER_ROLES.includes(role)) throw new Error("Invalid role.");
  return role;
}

function positiveInterval(value) {
  const interval = Number(value);
  if (!Number.isInteger(interval) || interval <= 0) {
    throw new Error("Interval must be a positive whole number of days.");
  }
  return interval;
}

const DUPLICATE_LOCATION_MESSAGE = "This location already exists (same site location, site name and room/area).";

function locationKey(siteCode, siteName, roomArea) {
  return [siteCode, siteName ?? "", roomArea ?? ""]
    .map((value) => String(value).trim().toLowerCase())
    .join("|");
}


async function findLocationId(
  supabase,
  siteCode,
  siteName,
  roomArea,
  excludeId = null,
) {
  const { data, error } = await supabase
    .from("locations")
    .select("id, site_code, site_name, room_area");
  if (error) throw error;
  const key = locationKey(siteCode, siteName, roomArea);
  const match = (data ?? []).find(
    (row) =>
      row.id !== excludeId &&
      locationKey(row.site_code, row.site_name, row.room_area) === key,
  );
  return match?.id ?? null;
}
// regex for site code filter
const SITE_CODE_PATTERN = /^[A-Z0-9-]+$/;

function locationValues(input, { optionalRoomArea = false } = {}) {
  const siteCode = required(input.site_code, "Site Location").toUpperCase();
  if (!SITE_CODE_PATTERN.test(siteCode)) {
    throw new Error(
      "Site Location may only contain letters, numbers, and '-' (no spaces or '/') ",
    );
  }
  return {
    site_code: siteCode,
    site_name: required(input.site_name, "Site Name"),
    room_area: optionalRoomArea
      ? String(input.room_area ?? "").trim() || null
      : required(input.room_area, "Room/area"),
  };
}
// 1:1 rule: a site code has exactly one site name, and a site name has exactly one code.
async function siteConflict(supabase, siteCode, siteName, excludeId = null) {
  const { data, error } = await supabase
    .from("locations")
    .select("id,site_code,site_name");

  if (error) throw error;
  const code = siteCode.trim().toUpperCase();
  const name = siteName.trim().toLowerCase();
  let existingName = null;

  for (const row of data ?? []) {
    if (row.id === excludeId) continue;
    const rowCode = String(row.site_code ?? "-")
      .trim()
      .toUpperCase();
    const rowName = String(row.site_name ?? "-").trim();

    if (rowCode === code && rowName.toLowerCase() !== name) {
      return {
        conflict: `Site Location ${code} is already used for ${rowName}. Use that site name, or choose a different one.`,
        existingName: null,
      };
    }
    if (rowName.toLowerCase() === name && rowCode !== code) {
      return {
        conflict: `Site Name "${rowName}" already uses Site Location ${rowCode}.`,
        existingName: null,
      };
    }
    if (rowCode === code) existingName = rowName;
  }
  return { conflict: null, existingName };
}

async function findOrCreateAdminLocation(supabase, input) {
  const values = locationValues(input);
  const { conflict, existingName } = await siteConflict(
    supabase,
    values.site_code,
    values.site_name,
  );
  if (conflict) throw new Error(conflict);
  if (existingName) values.site_name = existingName;
  const lookup = [values.site_code, values.site_name, values.room_area];

  const existingId = await findLocationId(supabase, ...lookup);
  if (existingId) return existingId;

  const { data, error } = await supabase
    .from("locations")
    .insert(values)
    .select("id")
    .single();
  
  if (error?.code === "23505") return findLocationId(supabase, ...lookup);
  if (error) throw error;
  return data.id;
}

function equipmentInput(input) {
  const amcDate = required(input.amc_date, "AMC date");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(amcDate))
    throw new Error("AMC date must be a valid date.");
  return {
    equipment_type_id: required(input.equipment_type_id, "Equipment category"),
    equipment_type: required(input.equipment_type, "Equipment type"),
    equipment_type_code: required(
      input.equipment_type_code,
      "Equipment type code",
    ).toUpperCase(),
    unit_number: Number(input.unit_number),
    name: required(input.name, "Equipment name"),
    status: toPascalDisplay(input.status, "Equipment status"),
    amc_frequency: toPascalDisplay(input.amc_frequency, "AMC frequency"),
    amc_date: amcDate,
    refill_date_co2: input.refill_date_co2 || null,
    refill_date_dcp: input.refill_date_dcp || null,
    capacity_type: String(input.capacity_type ?? "").trim() || null,
  };
}

async function addNextAmcDate(supabase, values, frequencyCode) {
  const { data: frequency, error } = await supabase
    .from("maintenance_frequencies")
    .select("interval_days")
    .eq("code", required(frequencyCode, "AMC frequency"))
    .single();
  if (error) throw error;
  if (!frequency.interval_days) {
    throw new Error(
      "The selected AMC frequency must have an interval in days.",
    );
  }
  const nextDate = new Date(`${values.amc_date}T00:00:00Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + frequency.interval_days);
  return { ...values, next_amc_date: nextDate.toISOString().slice(0, 10) };
}

function equipmentAssetId(siteCode, equipmentTypeCode, unitNumber) {
  return `${required(siteCode, "Site code")}/${required(equipmentTypeCode, "Equipment type code").toUpperCase()}/${unitNumber}`;
}

export async function createAdminEquipment(input) {
  const supabase = await requireAdmin();
  const locationId = await findOrCreateAdminLocation(supabase, input);
  const values = await addNextAmcDate(
    supabase,
    equipmentInput(input),
    input.amc_frequency,
  );
  if (!Number.isInteger(values.unit_number) || values.unit_number < 1)
    throw new Error("Unit number must be a positive whole number.");
  const { data: location, error: locationError } = await supabase
    .from("locations")
    .select("site_code")
    .eq("id", locationId)
    .single();
  if (locationError) throw locationError;
  const { error } = await supabase.from("equipment").insert({
    ...values,
    asset_id: equipmentAssetId(
      location.site_code,
      values.equipment_type_code,
      values.unit_number,
    ),
    location_id: locationId,
  });
  if (error)
    return {
      error:
        error.code === "23505"
          ? "An asset record with these details already exists."
          : userError(
              error,
              "Unable to save this asset. Please check the details and try again.",
            ),
    };
  revalidatePath("/equipment");
}

export async function importAdminEquipment(rows) {
  const supabase = await requireAdmin();
  if (!Array.isArray(rows) || rows.length < 1 || rows.length > 10) {
    throw new Error("Import batches must contain between 1 and 10 rows.");
  }
  const [types, statuses, frequencies] = await Promise.all([
    supabase.from("equipment_types").select("id, code, name").eq("is_active", true),
    supabase.from("status_values").select("code").eq("is_active", true),
    supabase.from("maintenance_frequencies").select("code, interval_days").eq("is_active", true),
  ]);
  const lookupError = [types, statuses, frequencies].find((result) => result.error)?.error;
  if (lookupError) throw new Error("Unable to load asset configuration.");

  const locations = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from("locations")
      .select("id, site_code, site_name, room_area")
      .order("id")
      .range(offset, offset + 499);
    if (error) throw new Error("Unable to load sites.");
    locations.push(...data);
    if (data.length < 500) break;
  }

  const existingKeys = new Set();
  const existingIds = new Set();
  const existingNames = new Set();
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from("equipment")
      .select("id, equipment_type_code, unit_number, asset_id, name")
      .order("id").range(offset, offset + 499);
    if (error) throw new Error("Unable to check existing assets.");
    for (const asset of data) {
      existingKeys.add(importAssetKey(asset.equipment_type_code, asset.unit_number));
      if (asset.asset_id) existingIds.add(asset.asset_id.trim().toUpperCase());
      if (asset.name) existingNames.add(asset.name.trim().toLowerCase());
    }
    if (data.length < 500) break;
  }

  const lookups = { types: types.data, statuses: statuses.data, frequencies: frequencies.data, locations, names: existingNames };
  const results = [];
  for (const row of rows) {
    const rowNumber = Number(row?.rowNumber);
    if (!Number.isSafeInteger(rowNumber) || rowNumber < 2) throw new Error("Invalid spreadsheet row number.");
    const validation = validateImportRow(row.values, lookups);
    if (validation.error) {
      results.push({ row: rowNumber, status: "Rejected", message: validation.error });
      continue;
    }
    const asset = validation.value;
    try {
      const { data: latestAsset, error: latestAssetError } = await supabase
        .from("equipment")
        .select("unit_number")
        .eq("equipment_type_code", asset.equipment_type_code)
        .order("unit_number", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latestAssetError) throw latestAssetError;
      asset.unit_number = (latestAsset?.unit_number ?? 0) + 1;
      const key = importAssetKey(asset.equipment_type_code, asset.unit_number);
      const assetId = equipmentAssetId(asset.site_code, asset.equipment_type_code, asset.unit_number).toUpperCase();
      if (existingKeys.has(key) || existingIds.has(assetId)) {
        results.push({ row: rowNumber, status: "Rejected", message: "Unable to assign a unique unit number. Please retry the import." });
        continue;
      }
      const result = await createAdminEquipment(asset);
      if (result?.error) {
        results.push({ row: rowNumber, status: "Rejected", message: result.error });
        continue;
      }
      existingKeys.add(key);
      existingIds.add(assetId);
      existingNames.add(asset.name.trim().toLowerCase());
      results.push({ row: rowNumber, status: "Imported", message: assetId });
    } catch (error) {
      results.push({ row: rowNumber, status: "Rejected", message: userError(error, "Unable to save this asset.") });
    }
  }
  return results;
}

export async function updateAdminEquipment(input) {
  const supabase = await requireAdmin();
  const locationId = await findOrCreateAdminLocation(supabase, input);
  const values = await addNextAmcDate(
    supabase,
    equipmentInput(input),
    input.amc_frequency,
  );
  if (!Number.isInteger(values.unit_number) || values.unit_number < 1)
    throw new Error("Unit number must be a positive whole number.");
  const { data: location, error: locationError } = await supabase
    .from("locations")
    .select("site_code")
    .eq("id", locationId)
    .single();
  if (locationError) throw locationError;
  const { error } = await supabase
    .from("equipment")
    .update({
      ...values,
      asset_id: equipmentAssetId(
        location.site_code,
        values.equipment_type_code,
        values.unit_number,
      ),
      location_id: locationId,
    })
    .eq("id", input.id);
  if (error)
    return {
      error:
        error.code === "23505"
          ? "An asset record with these details already exists."
          : userError(
              error,
              "Unable to save this asset. Please check the details and try again.",
            ),
    };
  revalidatePath("/equipment");
  revalidatePath(`/equipment/${input.id}`);
}

export async function deleteAdminEquipment(id) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("equipment").delete().eq("id", id);
  if (error)
    return {
      error:
        error.code === "23503"
          ? "This asset cannot be deleted because it has related inspection or movement history."
          : "Unable to delete this asset. Please try again.",
    };
  revalidatePath("/equipment");
}

export async function createLocation(input) {
  const supabase = await requireAdmin();
  const values = locationValues(input, { optionalRoomArea: true });
  const { conflict, existingName } = await siteConflict(
    supabase,
    values.site_code,
    values.site_name,
  );
  if (conflict) return { error: conflict };
  if (existingName) values.site_name = existingName;
  if (
    await findLocationId(
      supabase,
      values.site_code,
      values.site_name,
      values.room_area,
    )
  ) {
    return { error: DUPLICATE_LOCATION_MESSAGE };
  }
  const { error } = await supabase.from("locations").insert(values);
  if (error?.code === "23505") return { error: DUPLICATE_LOCATION_MESSAGE };
  if (error) throw error;
  revalidatePath("/locations");
  return { error: null };
}

export async function updateLocation(input) {
  const supabase = await requireAdmin();
  const values = locationValues(input);
  const { conflict, existingName } = await siteConflict(
    supabase,
    values.site_code,
    values.site_name,
    input.id,
  );
  if (conflict) return { error: conflict };
  if (existingName) values.site_name = existingName;
  if (
    await findLocationId(
      supabase,
      values.site_code,
      values.site_name,
      values.room_area,
      input.id,
    )
  ) {
    return { error: DUPLICATE_LOCATION_MESSAGE };
  }
  const { error } = await supabase
    .from("locations")
    .update(values)
    .eq("id", input.id);
  if (error?.code === "23505") return { error: DUPLICATE_LOCATION_MESSAGE };
  if (error) throw error;
  revalidatePath("/locations");
  return { error: null };
}

export async function deleteLocation(id) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("locations").delete().eq("id", id);
  if (error) {
    return {
      error: error.code === "23503"
        ? "This location cannot be deleted because it is linked to assets or movement history."
        : "Could not delete this location. Please try again.",
    };
  }
  revalidatePath("/locations");
  return { error: null };
}
export async function createEquipmentType(input) {
  const supabase = await requireAdmin();
  const name = required(input.name, "Name");
  if (!ASSET_NAME_CATEGORIES.includes(name)) {
    return { error: "Choose a name from the list." };
  }
  const { error } = await supabase.from("equipment_types").insert({
    code: required(input.code, "Code").toUpperCase(),
    name,
  });
  if (error)
    return {
      error: userError(
        error,
        "Unable to save this asset type. Please try again.",
      ),
    };
  revalidatePath("/equipment-types");
}

export async function updateEquipmentType(input) {
  const supabase = await requireAdmin();
  const name = required(input.name, "Name");
  if (!ASSET_NAME_CATEGORIES.includes(name)) {
    return { error: "Choose a name from the list." };
  }
  const { error } = await supabase
    .from("equipment_types")
    .update({
      code: required(input.code, "Code").toUpperCase(),
      name,
      is_active: input.is_active !== false,
    })
    .eq("id", input.id);
  if (error)
    return {
      error: userError(
        error,
        "Unable to save this asset type. Please try again.",
      ),
    };
  revalidatePath("/equipment-types");
}

export async function deleteEquipmentType(id) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("equipment_types")
    .update({ is_active: false })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/equipment-types");
}

export async function activateEquipmentType(id) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("equipment_types")
    .update({ is_active: true })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/equipment-types");
  revalidatePath("/equipment/new");
  revalidatePath("/equipment");
}

export async function createStatusValue(input) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("status_values").insert({
    code: required(input.code, "Code").toUpperCase(),
    label: required(input.label, "Label"),
    sort_order: Number(input.sort_order) || 0,
  });
  if (error) return { error: userError(error, "Unable to save this status. Please try again.") };
  revalidatePath("/configuration");
  revalidatePath("/statuses");
}

export async function updateStatusValue(input) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("status_values")
    .update({
      code: required(input.code, "Code").toUpperCase(),
      label: required(input.label, "Label"),
      sort_order: Number(input.sort_order) || 0,
      is_active: input.is_active !== false,
    })
    .eq("id", input.id);
  if (error) return { error: userError(error, "Unable to save this status. Please try again.") };
  revalidatePath("/configuration");
  revalidatePath("/statuses");
}

export async function deactivateStatusValue(id) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("status_values")
    .update({ is_active: false })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/configuration");
  revalidatePath("/statuses");
}

export async function createMaintenanceFrequency(input) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from("maintenance_frequencies").insert({
    code: required(input.code, "Code").toUpperCase(),
    label: required(input.label, "Label"),
    interval_days: positiveInterval(input.interval_days),
  });
  if (error) return { error: userError(error, "Unable to save this frequency. Please try again.") };
  revalidatePath("/configuration");
  revalidatePath("/frequencies");
}

export async function updateMaintenanceFrequency(input) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("maintenance_frequencies")
    .update({
      code: required(input.code, "Code").toUpperCase(),
      label: required(input.label, "Label"),
      interval_days: positiveInterval(input.interval_days),
      is_active: input.is_active !== false,
    })
    .eq("id", input.id);
  if (error) return { error: userError(error, "Unable to save this frequency. Please try again.") };
  revalidatePath("/configuration");
  revalidatePath("/frequencies");
}

export async function deactivateMaintenanceFrequency(id) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("maintenance_frequencies")
    .update({ is_active: false })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/configuration");
  revalidatePath("/frequencies");
}

export async function activateMaintenanceFrequency(id) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("maintenance_frequencies")
    .update({ is_active: true })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/configuration");
  revalidatePath("/frequencies");
  revalidatePath("/equipment/new");
  revalidatePath("/equipment");
}

export async function createSystemUser(input) {
  const supabase = await requireAdmin();
  const empId = required(input.emp_id, "Employee ID").toLowerCase();
  const email = `${empId}@sevenspikes.internal`;
  const password = required(input.password, "Password");
  const role = requiredUserRole(input.emp_role);

  const { data: authUser, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
  if (authError) return { error: authError.code === "email_exists" || authError.code === "user_already_exists"
    ? "An account with this employee ID already exists."
    : userError(authError, "Unable to create this user. Please check the details and try again.") };

  const { error: profileError } = await supabase.from("profiles").insert({
    id: authUser.user.id,
    name: required(input.name, "Name"),
    emp_id: empId,
    emp_role: role,
  });

  if (profileError) {
    await supabase.auth.admin.deleteUser(authUser.user.id);
    return { error: "Unable to finish creating this user. Please contact an administrator before trying again." };
  }

  revalidatePath("/users");
}

export async function updateSystemUser(input) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("profiles")
    .update({
      name: required(input.name, "Name"),
      emp_role: requiredUserRole(input.emp_role),
    })
    .eq("id", input.id);
  if (error) return { error: userError(error, "Unable to save this user. Please try again.") };
  revalidatePath("/users");
}

export async function deleteSystemUser(id) {
  const supabase = await requireAdmin();
  const { error } = await supabase.auth.admin.deleteUser(id);
  if (error) throw error;
  revalidatePath("/users");
}
