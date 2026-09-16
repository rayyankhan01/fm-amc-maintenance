import { notFound } from 'next/navigation';
import { Container, Typography } from '@mui/material';
import { createClient } from '@/lib/supabase/server';
import { updateStatusValue } from '@/features/admin/commands';
import AdminCrudForm from '@/features/admin/AdminCrudForm';

export default async function EditStatusPage({ params }) {
  const { id } = await params;
  const { data: item, error } = await (await createClient()).from('status_values').select('id, code, label, sort_order, is_active').eq('id', id).single();
  if (error || !item) notFound();
  return <Container maxWidth="sm" sx={{ py: 4 }}><Typography variant="h4" sx={{ mb: 3 }}>Edit status value</Typography><AdminCrudForm action={updateStatusValue} redirectTo="/statuses" initialValues={item} fields={[{ name: 'code', label: 'Code' }, { name: 'label', label: 'Label' }, { name: 'sort_order', label: 'Display order', type: 'number' }]} /></Container>;
}
