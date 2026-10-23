'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Card, CardContent, Grid, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TablePagination, TableRow, TableSortLabel, TextField, Typography } from '@mui/material';
import { printReport } from './reportPrint';

function equipmentLabel(item) {
  return item.equipment?.asset_id
    ?? (item.equipment ? `${item.equipment.equipment_type_code}/${item.equipment.unit_number}` : '-');
}

function assetType(item) {
  return item.equipment?.equipment_types?.name ?? '-';
}

function locationLabel(item) {
  const location = item.equipment?.locations;
  return location ? [location.site_name, location.site_code, location.room_area].filter(Boolean).join(' / ') || '-' : '-';
}

function siteLabel(item) {
  const location = item.equipment?.locations;
  return location ? [location.site_name, location.site_code].filter(Boolean).join(' / ') || '-' : '-';
}

function siteCode(item) {
  return item.equipment?.locations?.site_code ?? null;
}

function requiresMaintenance(item) {
  return (item.form_responses ?? []).some((response) => response.result === 'N_OK');
}

function MetricCard({ label, value, color }) {
  return <Card variant="outlined" sx={{ borderTop: 4, borderTopColor: `${color}.main` }}><CardContent><Typography color="text.secondary" variant="body2">{label}</Typography><Typography color={`${color}.dark`} variant="h4">{value}</Typography></CardContent></Card>;
}

function metricLabel(value) {
  return {
    all: 'All Assets',
    by_asset: 'Completed Inspections by Asset',
    requiring: 'Inspections Requiring Maintenance',
    cancelled: 'Cancelled Inspections',
  }[value] ?? value;
}

export default function SummaryReport({ submissions, equipment, frequencies, occurrences = [], onLocationChange, onPeriodChange }) {
  const todayDubai = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dubai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const [fromDate, setFromDate] = useState(`${todayDubai.slice(0, 7)}-01`);
  const [toDate, setToDate] = useState(todayDubai);
  const [location, setLocation] = useState('all');
  const [type, setType] = useState('all');
  const [metric, setMetric] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('asset');
  const [sortDirection, setSortDirection] = useState('asc');
  useEffect(() => {
    const period = fromDate && toDate
      ? `${fromDate} to ${toDate}`
      : fromDate
        ? `From ${fromDate}`
        : toDate
          ? `Until ${toDate}`
          : 'No AMC dates available';
    onPeriodChange?.(period);
  }, [fromDate, onPeriodChange, toDate]);
  const locations = useMemo(() => [...new Set(submissions.map(siteCode).filter(Boolean))].sort(), [submissions]);
  const assetTypes = useMemo(() => [...new Set(submissions.map(assetType).filter((value) => value !== '-'))].sort(), [submissions]);
  const expectedAssets = useMemo(() => (equipment ?? []).filter((item) =>
    (!fromDate || (item.next_amc_date && item.next_amc_date >= fromDate))
    && (!toDate || (item.amc_date && item.amc_date <= toDate))
    && (location === 'all' || siteCode({ equipment: item }) === location)
    && (type === 'all' || assetType({ equipment: item }) === type),
  ), [equipment, fromDate, location, toDate, type]);
  const baseRows = useMemo(() => submissions.filter((item) => {
    return (!fromDate || (item.inspection_date && item.inspection_date >= fromDate))
      && (!toDate || (item.inspection_date && item.inspection_date <= toDate))
      && (location === 'all' || siteCode(item) === location)
      && (type === 'all' || assetType(item) === type);
  }), [fromDate, location, submissions, toDate, type]);
  const frequencyByCode = new Map((frequencies ?? []).map((item) => [item.code.toLowerCase(), item.interval_days]));
  const occurrencesByAsset = new Map();
  for (const occurrence of occurrences) {
    const history = occurrencesByAsset.get(occurrence.equipment_id) ?? [];
    history.push(occurrence);
    occurrencesByAsset.set(occurrence.equipment_id, history);
  }
  const equipmentById = new Map((equipment ?? []).map((item) => [item.id, item]));
  const metricAssetIds = metric === 'all' || metric === 'cancelled'
    ? null
    : new Set(baseRows
      .filter((item) => metric !== 'requiring' || requiresMaintenance(item))
      .map((item) => item.equipment_id ?? item.equipment?.id)
      .filter(Boolean));
  const cancelledOccurrences = occurrences.filter((occurrence) => {
    const asset = equipmentById.get(occurrence.equipment_id);
    return occurrence.status === 'cancelled'
      && asset
      && (!metricAssetIds || metricAssetIds.has(occurrence.equipment_id))
      && (!fromDate || (occurrence.scheduled_date && occurrence.scheduled_date >= fromDate))
      && (!toDate || (occurrence.scheduled_date && occurrence.scheduled_date <= toDate))
      && (location === 'all' || asset.locations?.site_code === location)
      && (type === 'all' || assetType({ equipment: asset }) === type);
  });
  function expectedCount(asset, endDate = asset?.next_amc_date) {
    if (!asset?.amc_frequency || asset.amc_frequency.trim() === '-') return null;
    if (!asset.amc_date || !endDate) return null;
    const start = new Date(`${asset.amc_date}T00:00:00Z`);
    const end = new Date(`${endDate}T00:00:00Z`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
    const frequency = asset.amc_frequency.toLowerCase();
    if (frequency.includes('week')) {
      let mondayToSaturdayDays = 0;
      for (const day = new Date(start); day <= end; day.setUTCDate(day.getUTCDate() + 1)) {
        if (day.getUTCDay() >= 1 && day.getUTCDay() <= 6) mondayToSaturdayDays += 1;
      }
      return Math.floor(mondayToSaturdayDays / 6);
    }
    if (frequency.includes('month')) {
      return (end.getUTCFullYear() - start.getUTCFullYear()) * 12
        + end.getUTCMonth() - start.getUTCMonth() + 1;
    }
    if (frequency.includes('daily')) {
      return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
    }
    const intervalDays = frequencyByCode.get(frequency);
    if (!intervalDays) return 1;
    const periodDays = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
    return Math.max(1, Math.ceil(periodDays / intervalDays));
  }
  function cancellationCount(asset) {
    return cancelledOccurrences.filter((item) => item.equipment_id === asset?.id).length;
  }
  const cancelledRows = [...new Set(cancelledOccurrences.map((occurrence) => occurrence.equipment_id))]
    .map((equipmentId) => equipmentById.get(equipmentId))
    .filter(Boolean)
    .map((item) => ({ equipment: item, equipment_id: item.id }));
  const filteredRows = metric === 'cancelled'
    ? cancelledRows
    : baseRows.filter((item) => {
      if (metric === 'requiring') return requiresMaintenance(item);
      return true;
    });
  const cardRows = metric === 'cancelled' ? [] : filteredRows;
  const completedAssetCount = new Set(cardRows
    .map((item) => item.equipment_id ?? item.equipment?.id)
    .filter(Boolean)).size;
  const completedCountByAsset = new Map();
  for (const occurrence of occurrences) {
    if (occurrence.status !== 'completed') continue;
    if (metricAssetIds && !metricAssetIds.has(occurrence.equipment_id)) continue;
    if (fromDate && (!occurrence.scheduled_date || occurrence.scheduled_date < fromDate)) continue;
    if (toDate && (!occurrence.scheduled_date || occurrence.scheduled_date > toDate)) continue;
    const asset = equipmentById.get(occurrence.equipment_id);
    if (!asset) continue;
    if (location !== 'all' && asset.locations?.site_code !== location) continue;
    if (type !== 'all' && assetType({ equipment: asset }) !== type) continue;
    completedCountByAsset.set(occurrence.equipment_id, (completedCountByAsset.get(occurrence.equipment_id) ?? 0) + 1);
  }
  const maintenanceRows = cardRows.filter(requiresMaintenance);
  const rowsForAssetSummary = metric === 'all' || metric === 'by_asset'
    ? [...expectedAssets.map((item) => ({ equipment: item, equipment_id: item.id })), ...filteredRows]
    : filteredRows;
  const assetCounts = [...new Map(rowsForAssetSummary.map((item) => [equipmentLabel(item), 0])).keys()]
    .map((asset) => {
      const schedule = expectedAssets.find((record) => equipmentLabel({ equipment: record }) === asset)
        ?? equipment?.find((record) => record.asset_id === asset);
      const count = schedule && occurrencesByAsset.has(schedule.id)
        ? completedCountByAsset.get(schedule.id) ?? 0
        : filteredRows.filter((item) => equipmentLabel(item) === asset).length;
      const expected = expectedCount(schedule);
      return { asset, count, cancelled: expected === null ? '-' : cancellationCount(schedule) };
    })
    .filter((item) => metric !== 'by_asset' || item.count > 0);
  const displayedCompletedCount = assetCounts.reduce((total, item) => total + item.count, 0);
  const displayedCancelledCount = assetCounts.reduce((total, item) => total + (typeof item.cancelled === 'number' ? item.cancelled : 0), 0);
  const sortedAssetCounts = useMemo(() => [...assetCounts].sort((left, right) => {
    const leftSource = filteredRows.find((row) => equipmentLabel(row) === left.asset);
    const rightSource = filteredRows.find((row) => equipmentLabel(row) === right.asset);
    const leftSchedule = equipment?.find((record) => record.id === leftSource?.equipment_id) ?? leftSource?.equipment;
    const rightSchedule = equipment?.find((record) => record.id === rightSource?.equipment_id) ?? rightSource?.equipment;
    const leftValue = sortBy === 'asset' ? left.asset : sortBy === 'type' ? assetType(leftSource) : sortBy === 'location' ? locationLabel(leftSource) : sortBy === 'frequency' ? leftSchedule?.amc_frequency ?? '-' : sortBy === 'amcDate' ? leftSchedule?.amc_date ?? '-' : sortBy === 'nextAmc' ? leftSchedule?.next_amc_date ?? '-' : sortBy === 'cancelled' ? left.cancelled : left.count;
    const rightValue = sortBy === 'asset' ? right.asset : sortBy === 'type' ? assetType(rightSource) : sortBy === 'location' ? locationLabel(rightSource) : sortBy === 'frequency' ? rightSchedule?.amc_frequency ?? '-' : sortBy === 'amcDate' ? rightSchedule?.amc_date ?? '-' : sortBy === 'nextAmc' ? rightSchedule?.next_amc_date ?? '-' : sortBy === 'cancelled' ? right.cancelled : right.count;
    const comparison = typeof leftValue === 'number'
      ? leftValue - rightValue
      : String(leftValue).localeCompare(String(rightValue));
    return sortDirection === 'asc' ? comparison : -comparison;
  }), [assetCounts, equipment, filteredRows, sortBy, sortDirection]);
  const visibleAssetCounts = sortedAssetCounts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  function resetPage() {
    setPage(0);
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
      <TextField type="date" label="From AMC date" value={fromDate} onChange={(event) => { setFromDate(event.target.value); resetPage(); }} slotProps={{ inputLabel: { shrink: true } }} />
      <TextField type="date" label="To AMC date" value={toDate} onChange={(event) => { setToDate(event.target.value); resetPage(); }} slotProps={{ inputLabel: { shrink: true } }} />
      <TextField select label="Location" value={location} onChange={(event) => { setLocation(event.target.value); onLocationChange?.(event.target.value); resetPage(); }} sx={{ minWidth: 220 }}><MenuItem value="all">All locations</MenuItem>{locations.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField>
      <TextField select label="Asset type" value={type} onChange={(event) => { setType(event.target.value); resetPage(); }} sx={{ minWidth: 180 }}><MenuItem value="all">All asset types</MenuItem>{assetTypes.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField>
      <TextField select label="Summary metric" value={metric} onChange={(event) => { setMetric(event.target.value); resetPage(); }} sx={{ minWidth: 220 }}>
        <MenuItem value="all">All Assets</MenuItem>
        <MenuItem value="by_asset">Completed Inspections by Asset</MenuItem>
        <MenuItem value="requiring">Inspections Requiring Maintenance</MenuItem>
        <MenuItem value="cancelled">Cancelled Inspections</MenuItem>
      </TextField>
    </Stack>
    <Stack className="report-print-control" direction="row" spacing={1} sx={{ alignSelf: 'flex-start' }}>
      <Button variant="outlined" onClick={exportPdf}>Export PDF</Button>
    </Stack>
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}><MetricCard label="Inspections completed" value={displayedCompletedCount} color="primary" /></Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}><MetricCard label="Completed by asset" value={completedAssetCount} color="info" /></Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}><MetricCard label="Requiring maintenance" value={maintenanceRows.length} color="warning" /></Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}><MetricCard label="Without maintenance" value={cardRows.length - maintenanceRows.length} color="success" /></Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}><MetricCard label="Completed vs actual" value={`${displayedCompletedCount} / ${displayedCompletedCount + displayedCancelledCount}`} color="secondary" /></Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}><MetricCard label="Cancelled inspections" value={displayedCancelledCount} color="error" /></Grid>
    </Grid>
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 3 }}>
      <Typography variant="body2"><strong>Asset type:</strong> {type === 'all' ? 'All asset types' : type}</Typography>
      <Typography variant="body2"><strong>Summary metric:</strong> {metricLabel(metric)}</Typography>
    </Stack>
    <Paper className="report-table-paper" variant="outlined" sx={{ overflowX: 'auto' }}>
      <Table className="report-table"><TableHead><TableRow>
        {[['asset', 'Asset'], ['type', 'Asset type'], ['location', 'Location'], ['frequency', 'Frequency'], ['amcDate', 'AMC date'], ['nextAmc', 'Next AMC date'], ['count', 'Completed inspections'], ['cancelled', 'Cancelled']].map(([column, label]) => <TableCell key={column} sortDirection={sortBy === column ? sortDirection : false}>
          <TableSortLabel active={sortBy === column} direction={sortBy === column ? sortDirection : 'asc'} onClick={() => handleSort(column)}>{label}</TableSortLabel>
        </TableCell>)}
      </TableRow></TableHead>
        <TableBody>{visibleAssetCounts.map((item) => {
          const source = filteredRows.find((row) => equipmentLabel(row) === item.asset)
            ?? { equipment: equipment?.find((record) => record.asset_id === item.asset) };
          const schedule = equipment?.find((record) => record.id === source?.equipment_id) ?? source?.equipment;
          return <TableRow key={item.asset}><TableCell>{item.asset}</TableCell><TableCell>{assetType(source)}</TableCell><TableCell>{locationLabel(source)}</TableCell><TableCell>{schedule?.amc_frequency ?? '-'}</TableCell><TableCell>{schedule?.amc_date ?? '-'}</TableCell><TableCell>{schedule?.next_amc_date ?? '-'}</TableCell><TableCell>{item.count}</TableCell><TableCell>{item.cancelled}</TableCell></TableRow>;
        })}
          {assetCounts.length === 0 && <TableRow><TableCell colSpan={8}>No completed inspections match the selected filters.</TableCell></TableRow>}
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
