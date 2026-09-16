import { Container, Typography } from '@mui/material';
import AdminCrudForm from '@/features/admin/AdminCrudForm';
import { createSystemUser } from '@/features/admin/commands';

export default function NewUserPage() {
  return <Container maxWidth="sm" sx={{ py: 4 }}><Typography variant="h4" sx={{ mb: 3 }}>Create system user</Typography><AdminCrudForm action={createSystemUser} redirectTo="/users" initialValues={{ name: '', emp_id: '', password: '', emp_role: 'technician' }} fields={[{ name: 'name', label: 'Full name' }, { name: 'emp_id', label: 'Employee ID' }, { name: 'password', label: 'Temporary password', type: 'password' }, { name: 'emp_role', label: 'Role', type: 'select', options: [{ value: 'admin', label: 'Admin' }, { value: 'engineer', label: 'Engineer' }, { value: 'technician', label: 'Technician' }] }]} submitLabel="Create user" /></Container>;
}
