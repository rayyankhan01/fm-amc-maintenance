import { Container, Typography } from "@mui/material";
import AdminCrudForm from "@/features/admin/AdminCrudForm";
import { createEquipmentType } from "@/features/admin/commands";
import { ASSET_NAME_CATEGORIES } from "@/features/equipment/assetNameCategories";

export default function NewEquipmentTypePage() {
  const nameOptions = ASSET_NAME_CATEGORIES.map((asset) => ({
    label: asset,
    value: asset,
  }));
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Add Asset Type
      </Typography>
      <AdminCrudForm
        action={createEquipmentType}
        redirectTo="/equipment-types"
        initialValues={{ code: "", name: "" }}
        fields={[
          { name: "name", label: "Name", type: "select", options: nameOptions },
          { name: "code", label: "Code" },
        ]}
        submitLabel="Create asset type"
      />
    </Container>
  );
}
