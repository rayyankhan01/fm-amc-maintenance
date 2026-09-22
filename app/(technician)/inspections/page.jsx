import { Container, Typography, Stack } from "@mui/material";
import { createClient } from "@/lib/supabase/server";
import EquipmentList from "./EquipmentList";
import LogoutButton from "@/features/auth/components/LogoutButton";

export default async function InspectionsPage() {
  const supabase = await createClient();

  const [
    { data: equipment, error },
    { data: equipmentTypes, error: typesError },
  ] = await Promise.all([
    supabase
      .from("equipment")
      .select(
        "id, equipment_type_id, equipment_type_code, equipment_type, unit_number, name, status, locations (site_code, room_area)",
      )
      .order("unit_number", { ascending: true }),
    supabase.from("equipment_types").select("id, code ,name").order("name"),
  ]);

  if (error) throw error;
  if (typesError) throw typesError;

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

      <EquipmentList equipment={equipment} equipmentTypes={equipmentTypes} />
    </Container>
  );
}
