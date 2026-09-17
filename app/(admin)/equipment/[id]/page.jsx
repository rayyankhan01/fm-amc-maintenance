import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Container, Typography } from '@mui/material';
import { updateAdminEquipment } from '@/features/admin/commands';
import EquipmentForm from '../EquipmentForm';

async function getLookups(supabase) {
  const [types, statuses, frequencies] = await Promise.all([
    supabase.from('equipment_types').select('id, code, name').eq('is_active', true).order('name'),
    supabase.from('status_values').select('code, label').eq('is_active', true).order('sort_order'),
    supabase.from('maintenance_frequencies').select('code, label').eq('is_active', true).order('label'),
  ]);
  const failure = [types, statuses, frequencies].find((result) => result.error);
  if (failure?.error) throw failure.error;
  return { equipmentTypes: types.data ?? [], statuses: statuses.data ?? [], frequencies: frequencies.data ?? [] };
}

export default async function EditEquipmentPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: equipment, error }, lookups] = await Promise.all([
    supabase.from('equipment').select('id, equipment_type_id, equipment_type, equipment_type_code, unit_number, name, status, amc_frequency, locations(site_code, site_name, room_area)').eq('id', id).single(),
    getLookups(supabase),
  ]);
  if (error || !equipment) notFound();
  const location = equipment.locations ?? {};
  return <Container maxWidth="sm" sx={{ py: 4 }}><Typography variant="h5" sx={{ mb: 3 }}>Edit Equipment</Typography><EquipmentForm action={updateAdminEquipment} initialValues={{ id: equipment.id, equipment_type_id: equipment.equipment_type_id ?? '', equipment_type: equipment.equipment_type ?? '', equipment_type_code: equipment.equipment_type_code, unit_number: equipment.unit_number, name: equipment.name ?? '', site_name: location.site_name ?? '', site_code: location.site_code ?? '', room_area: location.room_area ?? '', status: equipment.status ?? '', amc_frequency: equipment.amc_frequency ?? '' }} {...lookups} submitLabel="Save equipment" /></Container>;
}
