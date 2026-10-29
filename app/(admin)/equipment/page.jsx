import { createClient } from "@/lib/supabase/server";
import {
  Container,
  Button,
  Chip,
  Stack,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import { deleteAdminEquipment } from "@/features/admin/commands";
import DeleteConfirmationButton from "../DeleteConfirmationButton";
import AdminList from "../AdminList";

export default async function AdminEquipmentPage() {
  const supabase = await createClient();
  const { data: equipment, error } = await supabase
    .from("equipment")
    .select(
      "id, asset_id, equipment_type_code, unit_number, name, equipment_type, status, amc_frequency, locations(site_code, site_name, room_area), equipment_types(code, name)",
    )
    .order("unit_number");
  if (error) throw error;
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack direction="row" sx={{ mb: 3, justifyContent: "space-between" }}>
        <Typography variant="h4">Assets</Typography>
        <Button href="/equipment/new" variant="contained">
          Add Asset
        </Button>
      </Stack>
        <AdminList
          columns={["Asset ID", "Asset name", "Category", "Asset type", "Site name", "Location", "Room/area", "Status", "AMC frequency", "Actions"]}
          searchLabel="Search assets"
          filters={[{ key: "category", label: "Category" }, { key: "site", label: "Site" }, { key: "status", label: "Status" }]}
          rows={equipment.map((item) => {
              const location = item.locations ?? {};
                const assetId = item.asset_id ?? `${location.site_code ?? "?"}/${item.equipment_type_code}/${item.unit_number}`;
                return {
                  id: item.id,
                  searchText: [assetId, item.name, item.equipment_types?.name, item.equipment_type, item.equipment_types?.code, location.site_code, location.site_name, location.room_area, item.status, item.amc_frequency].filter(Boolean).join(" "),
                  filters: { category: item.equipment_types?.name, site: location.site_code, status: item.status },
                  content: <TableRow key={item.id}>
                  <TableCell>
                    {item.asset_id ??
                      `${location.site_code ?? "?"}/${item.equipment_type_code}/${item.unit_number}`}
                  </TableCell>
                  <TableCell>{item.name ?? "-"}</TableCell>
                  <TableCell>{item.equipment_types?.name ?? "-"}</TableCell>
                  <TableCell>
                    {item.equipment_type ?? item.equipment_types?.code ?? "-"}
                  </TableCell>
                  <TableCell>{location.site_name ?? "-"}</TableCell>
                  <TableCell>{location.site_code ?? "-"}</TableCell>
                  <TableCell>{location.room_area ?? "-"}</TableCell>
                  <TableCell>
                    <Chip label={item.status ?? "-"} size="small" />
                  </TableCell>
                  <TableCell>{item.amc_frequency ?? "-"}</TableCell>
                  <TableCell>
                    <Button href={`/equipment/${item.id}`}>Edit</Button>
                    <form
                      action={deleteAdminEquipment.bind(null, item.id)}
                      style={{ display: "inline" }}
                    >
                      <DeleteConfirmationButton
                        title="Delete asset?"
                        message="This will permanently delete the asset record. Existing inspection history may prevent deletion."
                      />
                    </form>
                  </TableCell>
                </TableRow>,
              };
            })}
      />
    </Container>
  );
}
