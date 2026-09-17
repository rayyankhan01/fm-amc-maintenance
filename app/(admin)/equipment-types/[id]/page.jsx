import { notFound } from 'next/navigation';
import { Container, Typography } from '@mui/material';
import { createClient } from '@/lib/supabase/server';
import { updateEquipmentType } from '@/features/admin/commands';
import AdminCrudForm from '@/features/admin/AdminCrudForm';

export default async function EditEquipmentTypePage({ params }) {
  const { id } = await params;
  const { data: item, error } = await (await createClient()).from('equipment_types').select('id, code, name, is_active').eq('id', id).single();
  if (error || !item) notFound();
  return <Container maxWidth="sm" sx={{ py: 4 }}><Typography variant="h4" sx={{ mb: 3 }}>Edit device type</Typography><AdminCrudForm action={updateEquipmentType} redirectTo="/equipment-types" initialValues={item} fields={[{ name: 'code', label: 'Code' }, { name: 'name', label: 'Name' }]} /></Container>;
}
