import { createClient } from "@/lib/supabase/server";
import {
  Container,
  Button,
  Stack,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import {
  activateEquipmentType,
  deleteEquipmentType,
} from "@/features/admin/commands";
import DeleteConfirmationButton from "../DeleteConfirmationButton";
import AdminList from "../AdminList";

export default async function EquipmentTypesPage() {
  const { data, error } = await (await createClient())
    .from("equipment_types")
    .select("id, code, name, is_active")
    .order("name");
  if (error) throw error;
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" sx={{ mb: 3, justifyContent: "space-between" }}>
        <Typography variant="h4">Asset Types</Typography>
        <Button href="/equipment-types/new" variant="contained">
          Add Asset Type
        </Button>
      </Stack>
        <AdminList
          columns={["Code", "Name", "Active", "Actions"]}
          searchLabel="Search asset types"
          filters={[{ key: "active", label: "Status" }]}
          rows={data.map((item) => ({
            id: item.id,
            searchText: [item.code, item.name].filter(Boolean).join(" "),
            filters: { active: item.is_active ? "Active" : "Inactive" },
            content: <TableRow key={item.id}>
                <TableCell>{item.code}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.is_active ? "Yes" : "No"}</TableCell>
                <TableCell>
                  <Button href={`/equipment-types/${item.id}`}>Edit</Button>
                  {item.is_active ? (
                    <form
                      action={deleteEquipmentType.bind(null, item.id)}
                      style={{ display: "inline" }}
                    >
                      <DeleteConfirmationButton
                        actionLabel="Deactivate"
                        title="Deactivate asset type?"
                        message="Existing assets keep their current category, but this asset type will no longer be available for new assets."
                      />
                    </form>
                  ) : (
                    <form
                      action={activateEquipmentType.bind(null, item.id)}
                      style={{ display: "inline" }}
                    >
                      <Button type="submit" color="success">
                        Activate
                      </Button>
                    </form>
                  )}
                </TableCell>
              </TableRow>,
        }))}
      />
    </Container>
  );
}
