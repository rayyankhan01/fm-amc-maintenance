'use client';

import { useState } from 'react';
import { Paper, Stack, Typography } from '@mui/material';

function formatDateTime(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value);
}

export function formatReportPeriod(dates) {
  const validDates = dates.filter(Boolean).sort();
  if (validDates.length === 0) return 'No inspection dates available';
  if (validDates[0] === validDates[validDates.length - 1]) return validDates[0];
  return `${validDates[0]} to ${validDates[validDates.length - 1]}`;
}

export default function ReportHeader({ title, description, period, siteLocation = 'All sites / locations' }) {
  const [generatedAt] = useState(() => new Date());

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
      <Stack spacing={1}>
        <Typography variant="h5">Seven Spikes Group of Companies</Typography>
        <Typography variant="h6" sx={{ pt: 1 }}>{title}</Typography>
        {/* <Typography variant="body2" color="text.secondary">{description}</Typography> */}
        <Typography variant="body2"><strong>Department:</strong> Facilities Management</Typography>
        <Typography variant="body2"><strong>Site/Location:</strong> {siteLocation}</Typography>
        <Typography variant="body2"><strong>Report Period:</strong> {period}</Typography>
        <Typography variant="body2"><strong>Generate Date/Time:</strong> {formatDateTime(generatedAt)}</Typography>
      </Stack>
    </Paper>
  );
}
