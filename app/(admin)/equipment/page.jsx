import { createClient } from "@/lib/supabase/server";
import {
  Container,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { deleteAdminEquipment } from "@/features/admin/commands";
import DeleteConfirmationButton from "../DeleteConfirmationButton";

export default async function AdminEquipmentPage() {
  const supabase = await createClient();
  const { data: equipment, error } = await supabase
    .from("equipment")
    .select(
      "id, equipment_type_code, unit_number, name, equipment_type, status, amc_frequency, locations(site_code, site_name, room_area), equipment_types(code, name)",
    )
    .order("unit_number");
  if (error) throw error;
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h4">Equipment</Typography>
        <Button href="/equipment/new" variant="contained">
          Add equipment
        </Button>
      </Stack>
      <Paper variant="outlined" sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Asset ID</TableCell>
              <TableCell>Equipment name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Equipment type</TableCell>
              <TableCell>Site name</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Room/area</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>AMC frequency</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {equipment.map((item) => {
              const location = item.locations ?? {};
              return (
                <TableRow key={item.id}>
                  <TableCell>{`${location.site_code ?? "?"}/${item.equipment_type_code}/${item.unit_number}`}</TableCell>
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
                        title="Delete equipment?"
                        message="This will permanently delete the equipment record. Existing inspection history may prevent deletion."
                      />
                    </form>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
}
