import { createClient } from '@/lib/supabase/server';
import { Container, Button, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { deleteSystemUser } from '@/features/admin/commands';

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, name, emp_id, emp_role')
    .order('name');

  if (error) throw error;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 3 }}><Typography variant="h4">Users</Typography><Button href="/users/new" variant="contained">Create user</Button></Stack>
      <Paper variant="outlined">
        <Table>
          <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Employee ID</TableCell><TableCell>Role</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}><TableCell>{user.name}</TableCell><TableCell>{user.emp_id}</TableCell><TableCell>{user.emp_role}</TableCell><TableCell><Button href={`/users/${user.id}`}>Edit</Button><form action={deleteSystemUser.bind(null, user.id)} style={{ display: 'inline' }}><Button type="submit" color="error">Delete</Button></form></TableCell></TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
}
