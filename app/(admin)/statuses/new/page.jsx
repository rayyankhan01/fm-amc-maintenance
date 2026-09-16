import { Container, Typography } from '@mui/material';
import AdminCrudForm from '@/features/admin/AdminCrudForm';
import { createStatusValue } from '@/features/admin/commands';

export default function NewStatusPage() {
  return <Container maxWidth="sm" sx={{ py: 4 }}><Typography variant="h4" sx={{ mb: 3 }}>Add status value</Typography><AdminCrudForm action={createStatusValue} redirectTo="/statuses" initialValues={{ code: '', label: '', sort_order: 0 }} fields={[{ name: 'code', label: 'Code' }, { name: 'label', label: 'Label' }, { name: 'sort_order', label: 'Display order', type: 'number' }]} submitLabel="Create status" /></Container>;
}
