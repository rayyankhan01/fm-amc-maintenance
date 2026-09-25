import { Container, Typography } from '@mui/material';
import AdminCrudForm from '@/features/admin/AdminCrudForm';
import { createEquipmentType } from '@/features/admin/commands';

export default function NewEquipmentTypePage() {
  return <Container maxWidth="sm" sx={{ py: 4 }}><Typography variant="h4" sx={{ mb: 3 }}>Add equipment type</Typography><AdminCrudForm action={createEquipmentType} redirectTo="/equipment-types" initialValues={{ code: '', name: '' }} fields={[{ name: 'code', label: 'Code' }, { name: 'name', label: 'Name' }]} submitLabel="Create equipment type" /></Container>;
}
