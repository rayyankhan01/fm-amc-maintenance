import { Container, Typography, Stack, Button } from "@mui/material";
import { createClient } from "@/lib/supabase/server";
import EquipmentList from "./EquipmentList";
import LogoutButton from "@/features/auth/components/LogoutButton";
import Link from "next/link";
export default async function InspectionsPage() {
  const supabase = await createClient();

  const [
    { data: equipment, error },
    { data: equipmentTypes, error: typesError },
    { data: submissions, error: submissionError },
    { data: locations, error: locationsError },
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
    supabase
      .from("locations")
      .select("id,site_code,site_name")
      .order("site_code"),
  ]);
  const submittedIds = new Set(
    submissions?.map((row) => row.equipment_id) ?? [],
  );

  const uniqueSites = new Map();
  for (const row of locations ?? []) {
    if (!uniqueSites.has(row.site_code)) {
      uniqueSites.set(row.site_code, row);
    }
  }
  const sites = Array.from(uniqueSites.values());

  if (error) throw error;
  if (typesError) throw typesError;
  if (submissionError) throw submissionError;
  if (locationsError) throw locationsError;

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
        <Link
          href="/inspections/maintenance"
          style={{ textDecoration: "none" }}
        >
          <Button variant="contained" sx={{ mb: 3 }}>
            Maintenance
          </Button>
        </Link>
        <LogoutButton />
      </Stack>
      <Stack>
        <Typography variant="subtitle2" sx={{ mb: 2, color: "red" }}>
          NOTE : The status is currently visual, so it does not update once the
          deadline is due
        </Typography>
        <Link href="/inspections/amc/new" style={{ textDecoration: "none" }}>
          <Button variant="outlined" sx={{ mb: 3 }}>
            Equipment not listed? Add it here
          </Button>
        </Link>
      </Stack>

      <EquipmentList
        equipment={equipment}
        equipmentTypes={equipmentTypes}
        submissions={submittedIds}
        locations={sites}
      />
    </Container>
  );
}
