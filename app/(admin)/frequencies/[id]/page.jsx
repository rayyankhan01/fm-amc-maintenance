import { notFound } from 'next/navigation';
import { Container, Typography } from '@mui/material';
import { createClient } from '@/lib/supabase/server';
import { updateMaintenanceFrequency } from '@/features/admin/commands';
import AdminCrudForm from '@/features/admin/AdminCrudForm';

export default async function EditFrequencyPage({ params }) {
  const { id } = await params;
  const { data: item, error } = await (await createClient()).from('maintenance_frequencies').select('id, code, label, interval_days, is_active').eq('id', id).single();
  if (error || !item) notFound();
  return <Container maxWidth="sm" sx={{ py: 4 }}><Typography variant="h4" sx={{ mb: 3 }}>Edit maintenance frequency</Typography><AdminCrudForm action={updateMaintenanceFrequency} redirectTo="/frequencies" initialValues={item} fields={[{ name: 'code', label: 'Code' }, { name: 'label', label: 'Label' }, { name: 'interval_days', label: 'Interval in days', type: 'number' }]} /></Container>;
}
