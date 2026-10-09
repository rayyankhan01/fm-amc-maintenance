'use client';

import { useMemo, useState } from 'react';
import { Button, Card, CardContent, Grid, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TablePagination, TableRow, TableSortLabel, TextField, Typography } from '@mui/material';
import { printReport } from './reportPrint';

function equipmentLabel(item) {
  return item.equipment?.asset_id
    ?? (item.equipment ? `${item.equipment.equipment_type_code}/${item.equipment.unit_number}` : '-');
}

function assetType(item) {
  return item.equipment?.equipment_types?.name
    ?? item.equipment?.equipment_type
    ?? item.equipment?.equipment_type_code
    ?? '-';
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

function metricLabel(value) {
  return {
    all: 'All completed inspections',
    by_asset: 'Completed Inspections by Asset',
    requiring: 'Inspections Requiring Maintenance',
    without: 'Inspections Not Requiring Maintenance',
  }[value] ?? value;
}

export default function SummaryReport({ submissions, onLocationChange, onPeriodChange }) {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [location, setLocation] = useState('all');
  const [type, setType] = useState('all');
  const [metric, setMetric] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('asset');
  const [sortDirection, setSortDirection] = useState('asc');
  const locations = useMemo(() => [...new Set(submissions.map(locationLabel).filter((value) => value !== '-'))].sort(), [submissions]);
  const assetTypes = useMemo(() => [...new Set(submissions.map(assetType).filter((value) => value !== '-'))].sort(), [submissions]);
  const baseRows = useMemo(() => submissions.filter((item) => {
    const dateMatches = (!fromDate || item.inspection_date >= fromDate) && (!toDate || item.inspection_date <= toDate);
    return dateMatches
      && (location === 'all' || locationLabel(item) === location)
      && (type === 'all' || assetType(item) === type);
  }), [fromDate, location, submissions, toDate, type]);
  const filteredRows = useMemo(() => baseRows.filter((item) => {
    if (metric === 'requiring') return requiresMaintenance(item);
    if (metric === 'without') return !requiresMaintenance(item);
    return true;
  }), [baseRows, metric]);
  const maintenanceRows = baseRows.filter(requiresMaintenance);
  const assetCounts = [...new Map(filteredRows.map((item) => [equipmentLabel(item), 0])).keys()]
    .map((asset) => ({ asset, count: filteredRows.filter((item) => equipmentLabel(item) === asset).length }));
  const sortedAssetCounts = useMemo(() => [...assetCounts].sort((left, right) => {
    const leftSource = filteredRows.find((row) => equipmentLabel(row) === left.asset);
    const rightSource = filteredRows.find((row) => equipmentLabel(row) === right.asset);
    const leftValue = sortBy === 'asset' ? left.asset : sortBy === 'type' ? assetType(leftSource) : sortBy === 'location' ? locationLabel(leftSource) : left.count;
    const rightValue = sortBy === 'asset' ? right.asset : sortBy === 'type' ? assetType(rightSource) : sortBy === 'location' ? locationLabel(rightSource) : right.count;
    const comparison = typeof leftValue === 'number'
      ? leftValue - rightValue
      : String(leftValue).localeCompare(String(rightValue));
    return sortDirection === 'asc' ? comparison : -comparison;
  }), [assetCounts, filteredRows, sortBy, sortDirection]);
  const visibleAssetCounts = sortedAssetCounts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  function resetPage() {
    setPage(0);
  }
  function updatePeriod(nextFromDate, nextToDate) {
    onPeriodChange?.(nextFromDate && nextToDate
      ? `${nextFromDate} to ${nextToDate}`
      : nextFromDate
        ? `From ${nextFromDate}`
        : nextToDate
          ? `Until ${nextToDate}`
          : 'All inspection dates');
  }
  function handleSort(column) {
    if (sortBy === column) {
      setSortDirection((current) => current === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
    resetPage();
  }
  function exportPdf() {
    setPage(0);
    setRowsPerPage(Math.max(sortedAssetCounts.length, 1));
    window.setTimeout(() => printReport('Inspection summary report', 'print-summary-report'), 0);
  }
  return <Stack spacing={2}>
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
      <TextField type="date" label="From date" value={fromDate} onChange={(event) => { const nextFromDate = event.target.value; setFromDate(nextFromDate); updatePeriod(nextFromDate, toDate); resetPage(); }} slotProps={{ inputLabel: { shrink: true } }} />
      <TextField type="date" label="To date" value={toDate} onChange={(event) => { const nextToDate = event.target.value; setToDate(nextToDate); updatePeriod(fromDate, nextToDate); resetPage(); }} slotProps={{ inputLabel: { shrink: true } }} />
      <TextField select label="Location" value={location} onChange={(event) => { setLocation(event.target.value); onLocationChange?.(event.target.value); resetPage(); }} sx={{ minWidth: 220 }}><MenuItem value="all">All locations</MenuItem>{locations.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField>
      <TextField select label="Asset type" value={type} onChange={(event) => { setType(event.target.value); resetPage(); }} sx={{ minWidth: 180 }}><MenuItem value="all">All asset types</MenuItem>{assetTypes.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField>
      <TextField select label="Summary metric" value={metric} onChange={(event) => { setMetric(event.target.value); resetPage(); }} sx={{ minWidth: 220 }}>
        <MenuItem value="all">All completed inspections</MenuItem>
        <MenuItem value="by_asset">Completed Inspections by Asset</MenuItem>
        <MenuItem value="requiring">Inspections Requiring Maintenance</MenuItem>
        <MenuItem value="without">Inspections Not Requiring Maintenance</MenuItem>
      </TextField>
    </Stack>
    <Stack className="report-print-control" direction="row" spacing={1} sx={{ alignSelf: 'flex-start' }}>
      <Button variant="outlined" onClick={exportPdf}>Export PDF</Button>
    </Stack>
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}><MetricCard label="Inspections completed" value={filteredRows.length} /></Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}><MetricCard label="Completed by asset" value={assetCounts.length} /></Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}><MetricCard label="Requiring maintenance" value={maintenanceRows.length} /></Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}><MetricCard label="Without maintenance" value={filteredRows.length - maintenanceRows.length} /></Grid>
    </Grid>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 3 }}>
      <Typography variant="body2"><strong>Asset type:</strong> {type === 'all' ? 'All asset types' : type}</Typography>
      <Typography variant="body2"><strong>Summary metric:</strong> {metricLabel(metric)}</Typography>
    </Stack>
    <Paper className="report-table-paper" variant="outlined" sx={{ overflowX: 'auto' }}>
      <Table className="report-table"><TableHead><TableRow>
        {[['asset', 'Asset'], ['type', 'Asset type'], ['location', 'Location'], ['count', 'Completed inspections']].map(([column, label]) => <TableCell key={column} sortDirection={sortBy === column ? sortDirection : false}>
          <TableSortLabel active={sortBy === column} direction={sortBy === column ? sortDirection : 'asc'} onClick={() => handleSort(column)}>{label}</TableSortLabel>
        </TableCell>)}
      </TableRow></TableHead>
        <TableBody>{visibleAssetCounts.map((item) => {
          const source = filteredRows.find((row) => equipmentLabel(row) === item.asset);
          return <TableRow key={item.asset}><TableCell>{item.asset}</TableCell><TableCell>{assetType(source)}</TableCell><TableCell>{locationLabel(source)}</TableCell><TableCell>{item.count}</TableCell></TableRow>;
        })}
          {assetCounts.length === 0 && <TableRow><TableCell colSpan={4}>No completed inspections match the selected filters.</TableCell></TableRow>}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={sortedAssetCounts.length}
        page={page}
        onPageChange={(_, nextPage) => setPage(nextPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) => { setRowsPerPage(Number(event.target.value)); resetPage(); }}
        rowsPerPageOptions={[10, 25, 50]}
      />
    </Paper>
  </Stack>;
}
