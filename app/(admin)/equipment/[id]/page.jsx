import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Container, Typography } from "@mui/material";
import { updateAdminEquipment } from "@/features/admin/commands";
import EquipmentForm from "../EquipmentForm";

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

export default async function EditEquipmentPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: equipment, error }, lookups] = await Promise.all([
    supabase
      .from("equipment")
      .select(
        "id, equipment_type_id, equipment_type, equipment_type_code, unit_number, name, status, amc_frequency, locations(site_code, site_name, room_area)",
      )
      .eq("id", id)
      .single(),
    getLookups(supabase),
  ]);
  if (error || !equipment) notFound();
  const location = equipment.locations ?? {};
  const status =
    lookups.statuses.find(
      (item) => item.label.toLowerCase() === equipment.status?.toLowerCase(),
    )?.code ??
    equipment.status ??
    "";
  const amcFrequency =
    lookups.frequencies.find(
      (item) =>
        item.label.toLowerCase() === equipment.amc_frequency?.toLowerCase(),
    )?.code ??
    equipment.amc_frequency ??
    "";
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Edit Equipment
      </Typography>
      <EquipmentForm
        action={updateAdminEquipment}
        initialValues={{
          id: equipment.id,
          equipment_type_id: equipment.equipment_type_id ?? "",
          equipment_type: equipment.equipment_type ?? "",
          equipment_type_code: equipment.equipment_type_code,
          unit_number: equipment.unit_number,
          name: equipment.name ?? "",
          site_name: location.site_name ?? "",
          site_code: location.site_code ?? "",
          room_area: location.room_area ?? "",
          status,
          amc_frequency: amcFrequency,
        }}
        {...lookups}
        submitLabel="Save equipment"
      />
    </Container>
  );
}
