import { createClient } from '@/lib/supabase/server';
import { Alert, Chip, Container, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { getInspectionAlerts } from '@/features/alerts/api';

export default async function AlertsPage() {
  const supabase = await createClient();
  const { alerts, due, overdue, newAssets } = await getInspectionAlerts(supabase);

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h4">Alerts and Notifications</Typography>
          <Typography color="text.secondary">
            New assets and checklists that are due or overdue based on each equipment&apos;s AMC schedule.
          </Typography>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Alert severity="warning" sx={{ flex: 1 }}>Due checklists: {due.length}</Alert>
          <Alert severity="error" sx={{ flex: 1 }}>Overdue checklists: {overdue.length}</Alert>
          <Alert severity="info" sx={{ flex: 1 }}>New assets: {newAssets.length}</Alert>
        </Stack>
        <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Status</TableCell>
                <TableCell>Notification</TableCell>
                <TableCell>Equipment</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Frequency</TableCell>
                <TableCell>Next AMC</TableCell>
                <TableCell>Last submitted</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {alerts.map((item) => (
                <TableRow key={`${item.id}-${item.alertStatus}`}>
                  <TableCell><Chip label={item.alertStatus === 'new_asset' ? 'new asset' : item.alertStatus} color={item.alertStatus === 'overdue' ? 'error' : item.alertStatus === 'new_asset' ? 'info' : 'warning'} size="small" /></TableCell>
                  <TableCell>{item.equipmentLabel}</TableCell>
                  <TableCell>{item.name ?? '-'}</TableCell>
                  <TableCell>{item.locationLabel}</TableCell>
                  <TableCell>{item.amc_frequency ?? '-'}</TableCell>
                  <TableCell>{item.next_amc_date}</TableCell>
                  <TableCell>{item.alertStatus === 'new_asset' ? new Date(item.created_at).toLocaleDateString() : item.latest?.inspection_date ?? 'Never submitted'}</TableCell>
                </TableRow>
              ))}
              {alerts.length === 0 && (
                <TableRow><TableCell colSpan={8}>No new assets or due/overdue checklists.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      </Stack>
    </Container>
  );
}
