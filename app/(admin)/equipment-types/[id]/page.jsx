import { notFound } from "next/navigation";
import { Container, Typography } from "@mui/material";
import { createClient } from "@/lib/supabase/server";
import { updateEquipmentType } from "@/features/admin/commands";
import AdminCrudForm from "@/features/admin/AdminCrudForm";
import { ASSET_NAME_CATEGORIES } from "@/features/equipment/assetNameCategories";
export default async function EditEquipmentTypePage({ params }) {
  const nameOptions = ASSET_NAME_CATEGORIES.map((asset) => ({
    label: asset,
    value: asset,
  }));
  const { id } = await params;
  const { data: item, error } = await (await createClient())
    .from("equipment_types")
    .select("id, code, name, is_active")
    .eq("id", id)
    .single();
  if (error || !item) notFound();
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Edit asset type
      </Typography>
      <AdminCrudForm
        action={updateEquipmentType}
        redirectTo="/equipment-types"
        initialValues={item}
        fields={[
          { name: "name", label: "Name", type: "select", options: nameOptions },
          { name: "code", label: "Code" },
        ]}
      />
    </Container>
  );
}
