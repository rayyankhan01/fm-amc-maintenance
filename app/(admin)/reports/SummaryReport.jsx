'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, Grid, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';

function equipmentLabel(item) {
  return item.equipment?.asset_id
    ?? (item.equipment ? `${item.equipment.equipment_type_code}/${item.equipment.unit_number}` : '-');
}

function assetType(item) {
  return item.equipment?.equipment_type ?? item.equipment?.equipment_type_code ?? '-';
}

function locationLabel(item) {
  const location = item.equipment?.locations;
  return location ? [location.site_name, location.site_code, location.room_area].filter(Boolean).join(' / ') || '-' : '-';
}

function requiresMaintenance(item) {
  return (item.form_responses ?? []).some((response) => response.result === 'N_OK');
}

function MetricCard({ label, value }) {
  return <Card variant="outlined"><CardContent><Typography color="text.secondary" variant="body2">{label}</Typography><Typography variant="h4">{value}</Typography></CardContent></Card>;
}

export default function SummaryReport({ submissions }) {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [location, setLocation] = useState('all');
  const [type, setType] = useState('all');
  const locations = useMemo(() => [...new Set(submissions.map(locationLabel).filter((value) => value !== '-'))].sort(), [submissions]);
  const assetTypes = useMemo(() => [...new Set(submissions.map(assetType).filter((value) => value !== '-'))].sort(), [submissions]);
  const filteredRows = useMemo(() => submissions.filter((item) => {
    const dateMatches = (!fromDate || item.inspection_date >= fromDate) && (!toDate || item.inspection_date <= toDate);
    return dateMatches
      && (location === 'all' || locationLabel(item) === location)
      && (type === 'all' || assetType(item) === type);
  }), [fromDate, location, submissions, toDate, type]);
  const maintenanceRows = filteredRows.filter(requiresMaintenance);
  const assetCounts = [...new Map(filteredRows.map((item) => [equipmentLabel(item), 0])).keys()]
    .map((asset) => ({ asset, count: filteredRows.filter((item) => equipmentLabel(item) === asset).length }));
  return <Stack spacing={2}>
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
      <TextField type="date" label="From date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
      <TextField type="date" label="To date" value={toDate} onChange={(event) => setToDate(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
      <TextField select label="Location" value={location} onChange={(event) => setLocation(event.target.value)} sx={{ minWidth: 220 }}><MenuItem value="all">All locations</MenuItem>{locations.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField>
      <TextField select label="Asset type" value={type} onChange={(event) => setType(event.target.value)} sx={{ minWidth: 180 }}><MenuItem value="all">All asset types</MenuItem>{assetTypes.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField>
    </Stack>
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}><MetricCard label="Inspections completed" value={filteredRows.length} /></Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}><MetricCard label="Completed by asset" value={assetCounts.length} /></Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}><MetricCard label="Requiring maintenance" value={maintenanceRows.length} /></Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}><MetricCard label="Without maintenance" value={filteredRows.length - maintenanceRows.length} /></Grid>
    </Grid>
    <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
      <Table><TableHead><TableRow><TableCell>Asset</TableCell><TableCell>Asset type</TableCell><TableCell>Location</TableCell><TableCell>Completed inspections</TableCell></TableRow></TableHead>
        <TableBody>{assetCounts.map((item) => {
          const source = filteredRows.find((row) => equipmentLabel(row) === item.asset);
          return <TableRow key={item.asset}><TableCell>{item.asset}</TableCell><TableCell>{assetType(source)}</TableCell><TableCell>{locationLabel(source)}</TableCell><TableCell>{item.count}</TableCell></TableRow>;
        })}
          {assetCounts.length === 0 && <TableRow><TableCell colSpan={4}>No completed inspections match the selected filters.</TableCell></TableRow>}
        </TableBody>
      </Table>
    </Paper>
  </Stack>;
}
