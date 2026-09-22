import { createClient } from '@/lib/supabase/server';
import { Container, Button, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { deactivateStatusValue } from '@/features/admin/commands';
import DeleteConfirmationButton from '../DeleteConfirmationButton';

export default async function StatusesPage() {
  const { data, error } = await (await createClient()).from('status_values').select('id, code, label, sort_order, is_active').order('sort_order').order('label');
  if (error) throw error;
  return <Container maxWidth="lg" sx={{ py: 4 }}><Stack direction="row" justifycontent="space-between" sx={{ mb: 3 }}><Typography variant="h4">Status values</Typography><Button href="/statuses/new" variant="contained">Add status</Button></Stack><Paper variant="outlined"><Table><TableHead><TableRow><TableCell>Code</TableCell><TableCell>Label</TableCell><TableCell>Order</TableCell><TableCell>Active</TableCell><TableCell>Actions</TableCell></TableRow></TableHead><TableBody>{data.map((item) => <TableRow key={item.id}><TableCell>{item.code}</TableCell><TableCell>{item.label}</TableCell><TableCell>{item.sort_order}</TableCell><TableCell>{item.is_active ? 'Yes' : 'No'}</TableCell><TableCell><Button href={`/statuses/${item.id}`}>Edit</Button>{item.is_active && <form action={deactivateStatusValue.bind(null, item.id)} style={{ display: 'inline' }}><DeleteConfirmationButton actionLabel="Deactivate" title="Deactivate status?" message="Existing equipment keeps its current value, but this status will no longer be available for new equipment." /></form>}</TableCell></TableRow>)}</TableBody></Table></Paper></Container>;
}
