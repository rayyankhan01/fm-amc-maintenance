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

export async function createSystemUser(input) {
  const supabase = await requireAdmin();
  const empId = required(input.emp_id, 'Employee ID').toLowerCase();
  const email = `${empId}@sevenspikes.internal`;
  const password = required(input.password, 'Password');
  const role = required(input.emp_role, 'Role');

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
    emp_role: required(input.emp_role, 'Role'),
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
