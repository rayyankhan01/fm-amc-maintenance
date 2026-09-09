import { Container, Typography } from '@mui/material';
import { createClient } from '@/lib/supabase/server';
import EquipmentList from './EquipmentList';

export default async function InspectionsPage() {
  const supabase = await createClient();

  const { data: equipment, error } = await supabase
    .from('equipment')
    .select(
      'id, equipment_type_code, equipment_type, unit_number, name, status, locations ( site_code, room_area )'
    )
    .order('unit_number', { ascending: true });

  if (error) throw error;

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Select Equipment
      </Typography>
      <EquipmentList equipment={equipment} />
    </Container>
  );
}
