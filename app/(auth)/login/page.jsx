'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button, TextField, Card, CardContent, Typography, Box } from '@mui/material';

export default function LoginPage() {
  const router = useRouter();
  const [empId, setEmpId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Technicians log in with their employee ID, not an email. Supabase
    // Auth still needs an email-shaped identifier, so accounts are created
    // with a synthetic one derived from emp_id (never actually emailed to).
    const email = `${empId.trim().toLowerCase()}@sevenspikes.internal`;

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push('/inspections');
    router.refresh();
  }

  return (
    <Box
      component="form"
      onSubmit={handleLogin}
      sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}
    >
      <Card sx={{ width: 400 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 2 }}>
            FM AMC Maintenance
          </Typography>
          {error && (
            <Typography color="error" sx={{ mb: 1 }}>
              {error}
            </Typography>
          )}
          <TextField
            label="Employee ID"
            value={empId}
            onChange={(e) => setEmpId(e.target.value)}
            required
            fullWidth
            margin="normal"
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            margin="normal"
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{ mt: 1 }}
          >
            {loading ? 'Signing in...' : 'Login'}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
