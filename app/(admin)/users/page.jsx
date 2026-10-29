import { createClient } from '@/lib/supabase/server';
import { Container, Button, Stack, TableCell, TableRow, Typography } from '@mui/material';
import { deleteSystemUser } from '@/features/admin/commands';
import DeleteConfirmationButton from '../DeleteConfirmationButton';
import AdminList from '../AdminList';

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, name, emp_id, emp_role')
    .order('name');

  if (error) throw error;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" sx={{ mb: 3, justifyContent: 'space-between' }}><Typography variant="h4">Users</Typography><Button href="/users/new" variant="contained">Create user</Button></Stack>
        <AdminList
          columns={['Name', 'Employee ID', 'Role', 'Actions']}
          searchLabel="Search users"
          filters={[{ key: 'role', label: 'Role' }]}
          rows={users.map((user) => ({
            id: user.id,
            searchText: [user.name, user.emp_id, user.emp_role].filter(Boolean).join(' '),
            filters: { role: user.emp_role },
            content: <TableRow key={user.id}><TableCell>{user.name}</TableCell><TableCell>{user.emp_id}</TableCell><TableCell>{user.emp_role}</TableCell><TableCell><Button href={`/users/${user.id}`}>Edit</Button><form action={deleteSystemUser.bind(null, user.id)} style={{ display: 'inline' }}><DeleteConfirmationButton title="Delete user?" message="This will permanently delete the user account and profile. The user will no longer be able to sign in." /></form></TableCell></TableRow>,
          }))}
        />
    </Container>
  );
}
