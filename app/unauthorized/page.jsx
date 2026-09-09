import { Box, Typography } from '@mui/material';

export default function UnauthorizedPage() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Typography color="text.secondary">
        Your account does not have access to this page.
      </Typography>
    </Box>
  );
}
