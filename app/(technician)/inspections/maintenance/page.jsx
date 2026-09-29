import {
  Container,
  Typography,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  Chip,
  Stack,
  Button,
} from "@mui/material";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import LogoutButton from "@/features/auth/components/LogoutButton";

export default async function MaintenancePage() {
  const supabase = await createClient();

  const { data: issues, error } = await supabase
    .from("maintenance_issues")
    .select(
      ` id, status, opened_at,
      equipment ( id, name, equipment_type, equipment_type_code, unit_number, locations ( site_code, room_area ) ),
      form_responses ( remarks, form_fields ( label ) )`,
    )
    .eq("status", "open")
    .order("opened_at", { ascending: false });

  if (error) throw error;

  const groupByEquipment = new Map();
  for (const issue of issues) {
    const equipmentId = issue.equipment.id;
    if (!groupByEquipment.has(equipmentId)) {
      groupByEquipment.set(equipmentId, {
        equipment: issue.equipment,
        issues: [],
      });
    }
    groupByEquipment.get(equipmentId).issues.push(issue);
  }
  const groups = Array.from(groupByEquipment.values());

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
          Maintenance
        </Typography>
        <Link href="/inspections/amc" style={{ textDecoration: "none" }}>
          <Button variant="contained" sx={{ mb: 3 }}>
            AMC
          </Button>
        </Link>
        <LogoutButton />
      </Stack>

      {groups.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
          No open maintenance issues.
        </Typography>
      ) : (
        <Paper variant="outlined">
          <List disablePadding>
            {groups.map(({ equipment, issues }) => {
              const assetId = `${equipment.locations?.site_code ?? "?"}/${equipment.equipment_type_code}/${equipment.unit_number}`;
              return (
                <Link
                  key={equipment.id}
                  href={`/inspections/maintenance/${equipment.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <ListItemButton divider>
                    <ListItemText
                      primary={equipment.name ?? equipment.equipment_type}
                      secondary={assetId}
                    />
                    <Chip
                      label={`${issues.length} open`}
                      size="small"
                      color="error"
                    />
                  </ListItemButton>
                </Link>
              );
            })}
          </List>
        </Paper>
      )}
    </Container>
  );
}
