import { notFound } from 'next/navigation';
import { Container, Typography } from '@mui/material';
import { createClient } from '@/lib/supabase/server';
import { updateLocation } from '@/features/admin/commands';
import AdminCrudForm from '@/features/admin/AdminCrudForm';

export default async function EditLocationPage({ params }) {
  const { id } = await params;
  const { data: location, error } = await (await createClient()).from('locations').select('id, site_code, site_name, room_area').eq('id', id).single();
  if (error || !location) notFound();
  return <Container maxWidth="sm" sx={{ py: 4 }}><Typography variant="h4" sx={{ mb: 3 }}>Edit location</Typography><AdminCrudForm action={updateLocation} redirectTo="/locations" initialValues={location} fields={[{ name: 'site_code', label: 'Site code' }, { name: 'site_name', label: 'Site name', required: false }, { name: 'room_area', label: 'Room/area' }]} /></Container>;
}
