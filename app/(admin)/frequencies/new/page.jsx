import { Container, Typography } from '@mui/material';
import AdminCrudForm from '@/features/admin/AdminCrudForm';
import { createMaintenanceFrequency } from '@/features/admin/commands';

export default function NewFrequencyPage() {
  return <Container maxWidth="sm" sx={{ py: 4 }}><Typography variant="h4" sx={{ mb: 3 }}>Add maintenance frequency</Typography><AdminCrudForm action={createMaintenanceFrequency} redirectTo="/frequencies" initialValues={{ code: '', label: '', interval_days: 30 }} fields={[{ name: 'code', label: 'Code' }, { name: 'label', label: 'Label' }, { name: 'interval_days', label: 'Interval in days', type: 'number' }]} submitLabel="Create frequency" /></Container>;
}
