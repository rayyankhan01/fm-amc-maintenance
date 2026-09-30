'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth';

async function requireAdmin() {
  await requireRole(['admin']);
  return createAdminClient();
}

function required(value, label) {
  const normalized = String(value ?? '').trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function toPascalDisplay(value, label) {
  return required(value, label)
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

const USER_ROLES = ['admin', 'engineer', 'technician'];

function requiredUserRole(value) {
  const role = required(value, 'Role');
  if (!USER_ROLES.includes(role)) throw new Error('Invalid role.');
  return role;
}

function positiveInterval(value) {
  const interval = Number(value);
  if (!Number.isInteger(interval) || interval <= 0) {
    throw new Error('Interval must be a positive whole number of days.');
  }
  return interval;
}

async function findOrCreateAdminLocation(supabase, input) {
  const siteCode = required(input.site_code, 'Site code');
  const roomArea = required(input.room_area, 'Room/area');
  const siteName = String(input.site_name ?? '').trim() || null;
  const { data: existing, error: findError } = await supabase
    .from('locations')
    .select('id')
    .eq('site_code', siteCode)
    .eq('room_area', roomArea)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) {
    if (siteName) await supabase.from('locations').update({ site_name: siteName }).eq('id', existing.id);
    return existing.id;
  }
  const { data, error } = await supabase.from('locations').insert({
    site_code: siteCode,
    site_name: siteName,
    room_area: roomArea,
  }).select('id').single();
  if (error) throw error;
  return data.id;
}

function equipmentInput(input) {
  const amcDate = required(input.amc_date, 'AMC date');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(amcDate)) throw new Error('AMC date must be a valid date.');
  return {
    equipment_type_id: required(input.equipment_type_id, 'Equipment category'),
    equipment_type: required(input.equipment_type, 'Equipment type'),
    equipment_type_code: required(input.equipment_type_code, 'Equipment type code').toUpperCase(),
    unit_number: Number(input.unit_number),
    name: required(input.name, 'Equipment name'),
    status: toPascalDisplay(input.status, 'Equipment status'),
    amc_frequency: toPascalDisplay(input.amc_frequency, 'AMC frequency'),
    amc_date: amcDate,
  };
}

async function addNextAmcDate(supabase, values, frequencyCode) {
  const { data: frequency, error } = await supabase
    .from('maintenance_frequencies')
    .select('interval_days')
    .eq('code', required(frequencyCode, 'AMC frequency'))
    .single();
  if (error) throw error;
  if (!frequency.interval_days) {
    throw new Error('The selected AMC frequency must have an interval in days.');
  }
  const nextDate = new Date(`${values.amc_date}T00:00:00Z`);
  nextDate.setUTCDate(nextDate.getUTCDate() + frequency.interval_days);
  return { ...values, next_amc_date: nextDate.toISOString().slice(0, 10) };
}

function equipmentAssetId(siteCode, equipmentTypeCode, unitNumber) {
  return `${required(siteCode, 'Site code')}/${required(equipmentTypeCode, 'Equipment type code').toUpperCase()}/${unitNumber}`;
}

export async function createAdminEquipment(input) {
  const supabase = await requireAdmin();
  const locationId = await findOrCreateAdminLocation(supabase, input);
  const values = await addNextAmcDate(supabase, equipmentInput(input), input.amc_frequency);
  if (!Number.isInteger(values.unit_number) || values.unit_number < 1) throw new Error('Unit number must be a positive whole number.');
  const { data: location, error: locationError } = await supabase.from('locations').select('site_code').eq('id', locationId).single();
  if (locationError) throw locationError;
  const { error } = await supabase.from('equipment').insert({ ...values, asset_id: equipmentAssetId(location.site_code, values.equipment_type_code, values.unit_number), location_id: locationId });
  if (error) throw error;
  revalidatePath('/equipment');
}

export async function updateAdminEquipment(input) {
  const supabase = await requireAdmin();
  const locationId = await findOrCreateAdminLocation(supabase, input);
  const values = await addNextAmcDate(supabase, equipmentInput(input), input.amc_frequency);
  if (!Number.isInteger(values.unit_number) || values.unit_number < 1) throw new Error('Unit number must be a positive whole number.');
  const { data: location, error: locationError } = await supabase.from('locations').select('site_code').eq('id', locationId).single();
  if (locationError) throw locationError;
  const { error } = await supabase.from('equipment').update({ ...values, asset_id: equipmentAssetId(location.site_code, values.equipment_type_code, values.unit_number), location_id: locationId }).eq('id', input.id);
  if (error) throw error;
  revalidatePath('/equipment');
  revalidatePath(`/equipment/${input.id}`);
}

export async function deleteAdminEquipment(id) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from('equipment').delete().eq('id', id);
  if (error) throw error;
  revalidatePath('/equipment');
}

export async function createLocation(input) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from('locations').insert({
    site_code: required(input.site_code, 'Site code'),
    site_name: String(input.site_name ?? '').trim() || null,
    room_area: required(input.room_area, 'Room/area'),
  });
  if (error) throw error;
  revalidatePath('/locations');
}

export async function updateLocation(input) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from('locations').update({
    site_code: required(input.site_code, 'Site code'),
    site_name: String(input.site_name ?? '').trim() || null,
    room_area: required(input.room_area, 'Room/area'),
  }).eq('id', input.id);
  if (error) throw error;
  revalidatePath('/locations');
}

export async function deleteLocation(id) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from('locations').delete().eq('id', id);
  if (error) throw error;
  revalidatePath('/locations');
}

export async function createEquipmentType(input) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from('equipment_types').insert({
    code: required(input.code, 'Code').toUpperCase(),
    name: required(input.name, 'Name'),
  });
  if (error) throw error;
  revalidatePath('/equipment-types');
}

export async function updateEquipmentType(input) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from('equipment_types').update({
    code: required(input.code, 'Code').toUpperCase(),
    name: required(input.name, 'Name'),
    is_active: input.is_active !== false,
  }).eq('id', input.id);
  if (error) throw error;
  revalidatePath('/equipment-types');
}

export async function deleteEquipmentType(id) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from('equipment_types').update({ is_active: false }).eq('id', id);
  if (error) throw error;
  revalidatePath('/equipment-types');
}

export async function activateEquipmentType(id) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from('equipment_types').update({ is_active: true }).eq('id', id);
  if (error) throw error;
  revalidatePath('/equipment-types');
  revalidatePath('/equipment/new');
  revalidatePath('/equipment');
}

export async function createStatusValue(input) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from('status_values').insert({
    code: required(input.code, 'Code').toUpperCase(),
    label: required(input.label, 'Label'),
    sort_order: Number(input.sort_order) || 0,
  });
  if (error) throw error;
  revalidatePath('/configuration');
  revalidatePath('/statuses');
}

export async function updateStatusValue(input) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from('status_values').update({
    code: required(input.code, 'Code').toUpperCase(),
    label: required(input.label, 'Label'),
    sort_order: Number(input.sort_order) || 0,
    is_active: input.is_active !== false,
  }).eq('id', input.id);
  if (error) throw error;
  revalidatePath('/configuration');
  revalidatePath('/statuses');
}

export async function deactivateStatusValue(id) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from('status_values').update({ is_active: false }).eq('id', id);
  if (error) throw error;
  revalidatePath('/configuration');
  revalidatePath('/statuses');
}

export async function createMaintenanceFrequency(input) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from('maintenance_frequencies').insert({
    code: required(input.code, 'Code').toUpperCase(),
    label: required(input.label, 'Label'),
    interval_days: positiveInterval(input.interval_days),
  });
  if (error) throw error;
  revalidatePath('/configuration');
  revalidatePath('/frequencies');
}

export async function updateMaintenanceFrequency(input) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from('maintenance_frequencies').update({
    code: required(input.code, 'Code').toUpperCase(),
    label: required(input.label, 'Label'),
    interval_days: positiveInterval(input.interval_days),
    is_active: input.is_active !== false,
  }).eq('id', input.id);
  if (error) throw error;
  revalidatePath('/configuration');
  revalidatePath('/frequencies');
}

export async function deactivateMaintenanceFrequency(id) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from('maintenance_frequencies').update({ is_active: false }).eq('id', id);
  if (error) throw error;
  revalidatePath('/configuration');
  revalidatePath('/frequencies');
}

export async function activateMaintenanceFrequency(id) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from('maintenance_frequencies').update({ is_active: true }).eq('id', id);
  if (error) throw error;
  revalidatePath('/configuration');
  revalidatePath('/frequencies');
  revalidatePath('/equipment/new');
  revalidatePath('/equipment');
}

export async function createSystemUser(input) {
  const supabase = await requireAdmin();
  const empId = required(input.emp_id, 'Employee ID').toLowerCase();
  const email = `${empId}@sevenspikes.internal`;
  const password = required(input.password, 'Password');
  const role = requiredUserRole(input.emp_role);

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError) throw authError;

  const { error: profileError } = await supabase.from('profiles').insert({
    id: authUser.user.id,
    name: required(input.name, 'Name'),
    emp_id: empId,
    emp_role: role,
  });

  if (profileError) {
    await supabase.auth.admin.deleteUser(authUser.user.id);
    throw profileError;
  }

  revalidatePath('/users');
}

export async function updateSystemUser(input) {
  const supabase = await requireAdmin();
  const { error } = await supabase.from('profiles').update({
    name: required(input.name, 'Name'),
    emp_role: requiredUserRole(input.emp_role),
  }).eq('id', input.id);
  if (error) throw error;
  revalidatePath('/users');
}

export async function deleteSystemUser(id) {
  const supabase = await requireAdmin();
  const { error } = await supabase.auth.admin.deleteUser(id);
  if (error) throw error;
  revalidatePath('/users');
}
