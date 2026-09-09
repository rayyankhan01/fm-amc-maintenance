import { notFound } from 'next/navigation';
import { Container, Alert } from '@mui/material';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/auth';
import { getTemplateForEquipmentType, getTemplateWithFields } from '@/features/forms/api';
import ChecklistForm from '@/features/forms/components/ChecklistForm';

export default async function InspectionFormPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: equipment, error: equipmentError } = await supabase
    .from('equipment')
    .select(
      'id, equipment_type_code, equipment_type, unit_number, name, locations ( site_code, room_area )'
    )
    .eq('id', id)
    .single();

  if (equipmentError || !equipment) notFound();

  const template = await getTemplateForEquipmentType(supabase, equipment.equipment_type);

  if (!template) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">
          No inspection template exists for equipment type &quot;
          {equipment.equipment_type}&quot; yet.
        </Alert>
      </Container>
    );
  }

  const templateWithFields = await getTemplateWithFields(supabase, template.id);

  const assetId = `${equipment.locations?.site_code ?? '?'}/${equipment.equipment_type_code}/${equipment.unit_number}`;

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <ChecklistForm
        template={templateWithFields}
        equipment={equipment}
        assetId={assetId}
        technician={profile}
      />
    </Container>
  );
}
