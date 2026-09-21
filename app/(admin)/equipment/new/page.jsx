import { createClient } from "@/lib/supabase/server";
import { Typography, Container } from "@mui/material";
import { createAdminEquipment } from "@/features/admin/commands";
import EquipmentForm from "../EquipmentForm";
import AddEquipmentForm from "./AddEquipmentForm";

async function getLookups(supabase) {
  const [types, statuses, frequencies, locations] = await Promise.all([
    supabase
      .from("equipment_types")
      .select("id, code, name")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("status_values")
      .select("code, label")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("maintenance_frequencies")
      .select("code, label")
      .eq("is_active", true)
      .order("label"),
    supabase.from("locations").select("site_code,site_name").order("site_code"),
  ]);
  const failure = [types, statuses, frequencies, locations].find(
    (result) => result.error,
  );
  if (failure?.error) throw failure.error;
  const uniqueSite = new Map();
  for (const row of locations.data ?? []) {
    if (!uniqueSite.has(row.site_code)) {
      uniqueSite.set(row.site_code, row);
    }
  }
  return {
    equipmentTypes: types.data ?? [],
    statuses: statuses.data ?? [],
    frequencies: frequencies.data ?? [],
    locations: Array.from(uniqueSite.values()),
  };
}

export default async function NewEquipmentPage() {
  const lookups = await getLookups(await createClient());
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Add Equipment
      </Typography>
      <EquipmentForm
        action={createAdminEquipment}
        initialValues={{
          equipment_type_id: "",
          equipment_type: "",
          equipment_type_code: "",
          unit_number: "",
          name: "",
          site_name: "",
          site_code: "",
          room_area: "",
          status: lookups.statuses[0]?.code ?? "",
          amc_frequency: lookups.frequencies[0]?.code ?? "",
        }}
        {...lookups}
        submitLabel="Add equipment"
      />
    </Container>
  );
}
