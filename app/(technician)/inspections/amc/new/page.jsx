import { createClient } from "@/lib/supabase/server";
import { Container, Typography, Stack, Button } from "@mui/material";
import Link from "next/link";
import QuickAddForm from "./QuickAddForm";
export default async function QuickAddEquipmentPage() {
  const supabase = await createClient();

  const [
    { data: equipmentTypes, error: typesError },
    { data: locations, error: locationsError },
  ] = await Promise.all([
    supabase
      .from("equipment_types")
      .select("id,code,name")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("locations")
      .select("id,site_code,room_area")
      .order("site_code"),
  ]);

  if (typesError) throw typesError;
  if (locationsError) throw locationsError;

  const uniqueSites = new Map();
  for (const row of locations ?? []) {
    if (!uniqueSites.has(row.site_code)) {
      uniqueSites.set(row.site_code, row);
    }
  }
  const sites = Array.from(uniqueSites.values());
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
          Add Equipment & Inspect
        </Typography>
        <Link href="/inspections/amc" style={{ textDecoration: "none" }}>
          <Button variant="contained" sx={{ mb: 3 }}>
            Back to AMC
          </Button>
        </Link>
      </Stack>

      <QuickAddForm equipmentTypes={equipmentTypes} sites={sites} />
    </Container>
  );
}
