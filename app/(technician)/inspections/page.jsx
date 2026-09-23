import { Container, Typography, Stack } from "@mui/material";
import { createClient } from "@/lib/supabase/server";
import EquipmentList from "./EquipmentList";
import LogoutButton from "@/features/auth/components/LogoutButton";

export default async function InspectionsPage() {
  const supabase = await createClient();

  const [
    { data: equipment, error },
    { data: equipmentTypes, error: typesError },
    { data: submissions, error: submissionError },
  ] = await Promise.all([
    supabase
      .from("equipment")
      .select(
        "id, equipment_type_id, equipment_type_code, equipment_type, unit_number, name, status, locations (site_code, room_area)",
      )
      .order("unit_number", { ascending: true }),
    supabase.from("equipment_types").select("id, code ,name").order("name"),
    supabase
      .from("form_submissions")
      .select("equipment_id")
      .order("submitted_at"),
  ]);
  const submittedIds = new Set(
    submissions?.map((row) => row.equipment_id) ?? [],
  );
  if (error) throw error;
  if (typesError) throw typesError;
  if (submissionError) throw submissionError;

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 4,
        }}
      >
        <Typography variant="h5" sx={{ mb: 3 }}>
          Select Equipment
        </Typography>

        <LogoutButton />
      </Stack>
      <Stack>
        <Typography variant="subtitle2" sx={{ mb: 2, color: "red" }}>
          NOTE : The status is currently visual, so it does not update once the
          deadline is due
        </Typography>
      </Stack>

      <EquipmentList
        equipment={equipment}
        equipmentTypes={equipmentTypes}
        submissions={submittedIds}
      />
    </Container>
  );
}
