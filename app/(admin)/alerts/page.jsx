import { createClient } from "@/lib/supabase/server";
import { Alert, Container, Stack, Typography } from "@mui/material";
import { getInspectionAlerts } from "@/features/alerts/api";
import AlertTabs from "./AlertTabs";

export default async function AlertsPage() {
  const supabase = await createClient();
  const { due, overdue, newAssets, cancelledAlerts } =
    await getInspectionAlerts(supabase);

  return (
    <Container maxWidth="xl" sx={{ py: 5 }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h4">Alerts and Notifications</Typography>
          <Typography color="text.secondary">
            Due and overdue checklists, new assets added by technicians, and
            cancelled inspections.
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
        <AlertTabs
          dueOverdue={[...overdue, ...due]}
          newAssets={newAssets}
          cancelled={cancelledAlerts}
        />
      </Stack>
    </Container>
  );
}
