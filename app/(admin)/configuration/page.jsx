import { createClient } from '@/lib/supabase/server';
import { Container, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';

async function getConfiguration(supabase) {
  const [statuses, frequencies, settings] = await Promise.all([
    supabase.from('status_values').select('code, label, is_active').order('sort_order'),
    supabase.from('maintenance_frequencies').select('code, label, interval_days, is_active').order('label'),
    supabase.from('system_settings').select('key, value, description').order('key'),
  ]);
  const result = [statuses, frequencies, settings].find(({ error }) => error);
  if (result?.error) throw result.error;
  return { statuses: statuses.data ?? [], frequencies: frequencies.data ?? [], settings: settings.data ?? [] };
}

function ConfigurationTable({ title, columns, rows, renderRow }) {
  return (
    <Paper variant="outlined">
      <Typography variant="h6" sx={{ p: 2 }}>{title}</Typography>
      <Table size="small">
        <TableHead><TableRow>{columns.map((column) => <TableCell key={column}>{column}</TableCell>)}</TableRow></TableHead>
        <TableBody>{rows.map(renderRow)}</TableBody>
      </Table>
    </Paper>
  );
}

export default async function ConfigurationPage() {
  const configuration = await getConfiguration(await createClient());
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Typography variant="h4">System configuration</Typography>
        <ConfigurationTable title="Status values" columns={['Code', 'Label', 'Active']} rows={configuration.statuses} renderRow={(row) => (
          <TableRow key={row.code}><TableCell>{row.code}</TableCell><TableCell>{row.label}</TableCell><TableCell>{row.is_active ? 'Yes' : 'No'}</TableCell></TableRow>
        )} />
        <ConfigurationTable title="Maintenance frequencies" columns={['Code', 'Label', 'Interval (days)', 'Active']} rows={configuration.frequencies} renderRow={(row) => (
          <TableRow key={row.code}><TableCell>{row.code}</TableCell><TableCell>{row.label}</TableCell><TableCell>{row.interval_days ?? 'Custom'}</TableCell><TableCell>{row.is_active ? 'Yes' : 'No'}</TableCell></TableRow>
        )} />
        <ConfigurationTable title="System settings" columns={['Key', 'Value', 'Description']} rows={configuration.settings} renderRow={(row) => (
          <TableRow key={row.key}><TableCell>{row.key}</TableCell><TableCell>{JSON.stringify(row.value)}</TableCell><TableCell>{row.description ?? '-'}</TableCell></TableRow>
        )} />
      </Stack>
    </Container>
  );
}
