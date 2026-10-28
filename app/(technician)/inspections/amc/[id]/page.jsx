import { notFound } from "next/navigation";
import { Container, Alert, Button } from "@mui/material";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import {
  getTemplateForEquipmentType,
  getTemplateWithFields,
  getSubmissionWithResponses,
} from "@/features/forms/api";
import ChecklistForm from "@/features/forms/components/ChecklistForm";
import SubmissionViewer from "@/features/forms/components/SubmissionViewer";
import BackButton from "./BackButton";

export default async function InspectionFormPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: latestSubmission } = await supabase
    .from("form_submissions")
    .select("id")
    .eq("equipment_id", id)
    .eq("form_status", "completed")
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: equipment, error: equipmentError } = await supabase
    .from("equipment")
    .select(
      "id, equipment_type_code, equipment_type,equipment_type_id, unit_number, name, next_amc_date, locations ( site_code, room_area )",
    )
    .eq("id", id)
    .single();

  if (equipmentError || !equipment) notFound();

  // checks if the latest submission is still valid based on the next_amc_date of the equipment
  const today = new Date().toISOString().slice(0, 10);
  const isStillSubmitted = equipment.next_amc_date
    ? equipment.next_amc_date > today
    : Boolean(latestSubmission);

  if (latestSubmission && isStillSubmitted) {
    const submission = await getSubmissionWithResponses(
      supabase,
      latestSubmission.id,
    );
    return (
      <Container
        maxWidth="sm"
        sx={{ py: 4, "& .manager-signature-slot": { display: "none" } }}
      >
        <BackButton />
        <SubmissionViewer submission={submission} />
      </Container>
    );
  }

  const template = await getTemplateForEquipmentType(
    supabase,
    equipment.equipment_type_id,
  );

  if (!template) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">
          No inspection template exists for equipment type &quot;
          {equipment.equipment_type}&quot; yet.
        </Alert>
        <BackButton />
      </Container>
    );
  }

  const templateWithFields = await getTemplateWithFields(supabase, template.id);

  const assetId = `${equipment.locations?.site_code ?? "?"}/${equipment.equipment_type_code}/${equipment.unit_number}`;

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <BackButton />
      <ChecklistForm
        template={templateWithFields}
        equipment={equipment}
        assetId={assetId}
        technician={profile}
      />
    </Container>
  );
}
