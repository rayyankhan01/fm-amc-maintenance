import { createClient } from "@/lib/supabase/server";
import {
  Alert,
  Chip,
  Container,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { getInspectionAlerts } from "@/features/alerts/api";

export default async function AlertsPage() {
  const supabase = await createClient();
  const { alerts, due, overdue, newAssets, cancelledAlerts } =
    await getInspectionAlerts(supabase);

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h4">Alerts and Notifications</Typography>
          <Typography color="text.secondary">
            New assets and checklists that are due or overdue based on each
            Asset&apos;s AMC schedule.
          </Typography>
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Alert severity="warning" sx={{ flex: 1 }}>
            Due Checklists: {due.length}
          </Alert>
          <Alert severity="error" sx={{ flex: 1 }}>
            Overdue Checklists: {overdue.length}
          </Alert>
          <Alert severity="info" sx={{ flex: 1 }}>
            New Assets: {newAssets.length}
          </Alert>
          <Alert color="secondary" sx={{ flex: 1 }}>
            Cancelled Inspections: {cancelledAlerts.length}
          </Alert>
        </Stack>
        <Paper variant="outlined" sx={{ overflowX: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>Notification</TableCell>
                <TableCell>Asset ID</TableCell>
                <TableCell>Asset Name</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Frequency</TableCell>
                <TableCell>Next AMC</TableCell>
                <TableCell>Last submitted</TableCell>
                <TableCell>Reason</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {alerts.map((item) => (
                <TableRow key={`${item.id}-${item.alertStatus}`}>
                  <TableCell>
                    <Chip
                      label={
                        item.alertStatus === "new_asset"
                          ? "new asset"
                          : item.alertStatus
                      }
                      color={
                        item.alertStatus === "overdue"
                          ? "error"
                          : item.alertStatus === "cancelled"
                            ? "secondary"
                            : item.alertStatus === "new_asset"
                              ? "info"
                              : "warning"
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {item.alertStatus === "overdue"
                      ? "Checklist is overdue"
                      : item.alertStatus === "due"
                        ? "Checklist is due"
                        : item.alertStatus === "new_asset"
                          ? "New asset added by technician"
                          : item.alertStatus === "cancelled"
                            ? "Technician cancelled this inspection"
                            : "-"}
                  </TableCell>
                  <TableCell>{item.equipmentLabel}</TableCell>
                  <TableCell>{item.name ?? "-"}</TableCell>
                  <TableCell>{item.locationLabel}</TableCell>
                  <TableCell>{item.amc_frequency ?? "-"}</TableCell>
                  <TableCell>{item.next_amc_date}</TableCell>

                  <TableCell>
                    {item.alertStatus === "new_asset"
                      ? new Date(item.created_at).toLocaleDateString()
                      : item.alertStatus === "cancelled"
                        ? `Cancelled ${item.latest?.inspection_date}`
                        : (item.latest?.inspection_date ?? "Never submitted")}
                  </TableCell>
                  <TableCell>
                    {item.alertStatus === "cancelled"
                      ? (item.latest?.cancellation_reason ?? "-")
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
              {alerts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9}>
                    No new assets or due/overdue checklists.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      </Stack>
    </Container>
  );
}
