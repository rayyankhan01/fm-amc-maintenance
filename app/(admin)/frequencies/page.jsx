import { createClient } from '@/lib/supabase/server';
import { Container, Button, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { deactivateMaintenanceFrequency } from '@/features/admin/commands';
import DeleteConfirmationButton from '../DeleteConfirmationButton';

export default async function FrequenciesPage() {
  const { data, error } = await (await createClient()).from('maintenance_frequencies').select('id, code, label, interval_days, is_active').order('label');
  if (error) throw error;
  return <Container maxWidth="lg" sx={{ py: 4 }}><Stack direction="row" sx={{ mb: 3, justifyContent: 'space-between' }}><Typography variant="h4">Maintenance frequencies</Typography><Button href="/frequencies/new" variant="contained">Add frequency</Button></Stack><Paper variant="outlined"><Table><TableHead><TableRow><TableCell>Code</TableCell><TableCell>Label</TableCell><TableCell>Interval (days)</TableCell><TableCell>Active</TableCell><TableCell>Actions</TableCell></TableRow></TableHead><TableBody>{data.map((item) => <TableRow key={item.id}><TableCell>{item.code}</TableCell><TableCell>{item.label}</TableCell><TableCell>{item.interval_days}</TableCell><TableCell>{item.is_active ? 'Yes' : 'No'}</TableCell><TableCell><Button href={`/frequencies/${item.id}`}>Edit</Button>{item.is_active && <form action={deactivateMaintenanceFrequency.bind(null, item.id)} style={{ display: 'inline' }}><DeleteConfirmationButton actionLabel="Deactivate" title="Deactivate frequency?" message="Existing equipment keeps its current value, but this frequency will no longer be available for new equipment." /></form>}</TableCell></TableRow>)}</TableBody></Table></Paper></Container>;
}
