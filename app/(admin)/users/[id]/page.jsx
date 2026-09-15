import { notFound } from 'next/navigation';
import { Container, Typography } from '@mui/material';
import { createClient } from '@/lib/supabase/server';
import { updateSystemUser } from '@/features/admin/commands';
import AdminCrudForm from '@/features/admin/AdminCrudForm';

export default async function EditUserPage({ params }) {
  const { id } = await params;
  const { data: user, error } = await (await createClient()).from('profiles').select('id, name, emp_id, emp_role').eq('id', id).single();
  if (error || !user) notFound();
  return <Container maxWidth="sm" sx={{ py: 4 }}><Typography variant="h4" sx={{ mb: 3 }}>Edit system user</Typography><Typography color="text.secondary" sx={{ mb: 2 }}>Employee ID: {user.emp_id}</Typography><AdminCrudForm action={updateSystemUser} redirectTo="/users" initialValues={{ id, name: user.name, emp_role: user.emp_role }} fields={[{ name: 'name', label: 'Full name' }, { name: 'emp_role', label: 'Role' }]} /></Container>;
}
