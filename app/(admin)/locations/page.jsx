import { createClient } from '@/lib/supabase/server';
import { Container, Button, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { deleteLocation } from '@/features/admin/commands';
import DeleteConfirmationButton from '../DeleteConfirmationButton';

export default async function LocationsPage() {
  const supabase = await createClient();
  const { data: locations, error } = await supabase.from('locations').select('id, site_code, site_name, room_area').order('site_code').order('room_area');
  if (error) throw error;
  return <Container maxWidth="lg" sx={{ py: 4 }}><Stack direction="row" justifyContent="space-between" sx={{ mb: 3 }}><Typography variant="h4">Locations</Typography><Button href="/locations/new" variant="contained">Add location</Button></Stack><Paper variant="outlined"><Table><TableHead><TableRow><TableCell>Site</TableCell><TableCell>Name</TableCell><TableCell>Room/area</TableCell><TableCell>Actions</TableCell></TableRow></TableHead><TableBody>{locations.map((location) => <TableRow key={location.id}><TableCell>{location.site_code}</TableCell><TableCell>{location.site_name ?? '-'}</TableCell><TableCell>{location.room_area}</TableCell><TableCell><Button href={`/locations/${location.id}`}>Edit</Button><form action={deleteLocation.bind(null, location.id)} style={{ display: 'inline' }}><DeleteConfirmationButton title="Delete location?" message="This will permanently delete this location. Equipment or movement history may prevent deletion." /></form></TableCell></TableRow>)}</TableBody></Table></Paper></Container>;
}
