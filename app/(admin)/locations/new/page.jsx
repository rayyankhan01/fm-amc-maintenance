import { Container, Typography } from '@mui/material';
import AdminCrudForm from '@/features/admin/AdminCrudForm';
import { createLocation } from '@/features/admin/commands';

export default function NewLocationPage() {
  return <Container maxWidth="sm" sx={{ py: 4 }}><Typography variant="h4" sx={{ mb: 3 }}>Add location</Typography><AdminCrudForm action={createLocation} redirectTo="/locations" initialValues={{ site_code: '', site_name: '', room_area: '' }} fields={[{ name: 'site_code', label: 'Site code' }, { name: 'site_name', label: 'Site name', required: false }, { name: 'room_area', label: 'Room/area' }]} submitLabel="Create location" /></Container>;
}
