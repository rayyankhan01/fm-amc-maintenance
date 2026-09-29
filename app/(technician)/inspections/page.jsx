import { Container, Typography, Stack } from "@mui/material";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EquipmentList from "./EquipmentList";
import LogoutButton from "@/features/auth/components/LogoutButton";

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
        "id, asset_id, equipment_type_id, equipment_type_code, equipment_type, unit_number, name, status, locations (site_code, room_area)",
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

export default function InspectionsHomePage() {
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ mb: 4, textAlign: "center" }}>
        Select
      </Typography>
      <Grid container spacing={2}>
        <Grid size={6}>
          <Link
            href="/inspections/amc"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
              AMC
            </Paper>
          </Link>
        </Grid>
        <Grid size={6}>
          <Link
            href="/inspections/maintenance"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
              Maintenance
            </Paper>
          </Link>
        </Grid>
      </Grid>
    </Container>
  );
}
