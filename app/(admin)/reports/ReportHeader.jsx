'use client';

import { useState } from 'react';
import { Paper, Stack, Typography } from '@mui/material';

function formatDateTime(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value);
}

export default function ReportHeader({ title, description, period }) {
  const [generatedAt] = useState(() => new Date());

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
      <Stack spacing={1}>
        <Typography variant="h5">Seven Spikes</Typography>
        <Typography variant="body2"><strong>Department:</strong> Facilities Management</Typography>
        <Typography variant="body2"><strong>Site/Location:</strong> All sites / locations</Typography>
        <Typography variant="h6" sx={{ pt: 1 }}>{title}</Typography>
        <Typography variant="body2" color="text.secondary">{description}</Typography>
        <Typography variant="body2"><strong>Report Period:</strong> {period}</Typography>
        <Typography variant="body2"><strong>Generate Date/Time:</strong> {formatDateTime(generatedAt)}</Typography>
      </Stack>
    </Paper>
  );
}
