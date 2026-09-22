import { createClient } from '@/lib/supabase/server';
import { Container, Button, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { deleteEquipmentType } from '@/features/admin/commands';

export default async function EquipmentTypesPage() {
  const { data, error } = await (await createClient()).from('equipment_types').select('id, code, name, is_active').order('name');
  if (error) throw error;
  return <Container maxWidth="lg" sx={{ py: 4 }}><Stack direction="row" justifyContent="space-between" sx={{ mb: 3 }}><Typography variant="h4">Device types</Typography><Button href="/equipment-types/new" variant="contained">Add device type</Button></Stack><Paper variant="outlined"><Table><TableHead><TableRow><TableCell>Code</TableCell><TableCell>Name</TableCell><TableCell>Active</TableCell><TableCell>Actions</TableCell></TableRow></TableHead><TableBody>{data.map((item) => <TableRow key={item.id}><TableCell>{item.code}</TableCell><TableCell>{item.name}</TableCell><TableCell>{item.is_active ? 'Yes' : 'No'}</TableCell><TableCell><Button href={`/equipment-types/${item.id}`}>Edit</Button>{item.is_active && <form action={deleteEquipmentType.bind(null, item.id)} style={{ display: 'inline' }}><Button type="submit" color="error">Deactivate</Button></form>}</TableCell></TableRow>)}</TableBody></Table></Paper></Container>;
}
