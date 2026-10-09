'use client';

import { useState } from 'react';
import { Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Stack, Tab, Table, TableBody, TableCell, TableHead, TablePagination, TableRow, Tabs, TextField, Typography } from '@mui/material';
import { exportCsv } from './reportUtils';
import { printReport } from './reportPrint';
import ReportHeader, { formatReportPeriod } from './ReportHeader';
import SummaryReport from './SummaryReport';

function equipmentLabel(item) {
  return item.asset_id ?? `${item.equipment_type_code}/${item.unit_number}`;
}

function locationLabel(item) {
  const location = item.locations ?? item.equipment?.locations;
  return location ? [location.site_name, location.site_code, location.room_area].filter(Boolean).join(' / ') : '-';
}

function InspectionHistoryDialog({ equipment }) {
  const [open, setOpen] = useState(false);
  return <>
    <Button size="small" onClick={() => setOpen(true)} disabled={equipment.history.length === 0}>
      {equipment.history.length ? `View (${equipment.history.length})` : 'No history'}
    </Button>
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle>Inspection history: {equipmentLabel(equipment)}</DialogTitle>
      <DialogContent dividers>
        <Table size="small">
          <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Template</TableCell><TableCell>Technician</TableCell><TableCell /></TableRow></TableHead>
          <TableBody>{equipment.history.map((inspection) => <TableRow key={inspection.id}>
            <TableCell>{inspection.inspection_date}</TableCell>
            <TableCell>{inspection.form_templates?.name ?? '-'}</TableCell>
            <TableCell>{inspection.profiles?.name ?? '-'}</TableCell>
            <TableCell><Button size="small" href={`/reports/${inspection.id}`}>View</Button></TableCell>
          </TableRow>)}</TableBody>
        </Table>
      </DialogContent>
      <DialogActions><Button onClick={() => setOpen(false)}>Close</Button></DialogActions>
    </Dialog>
  </>;
}

function ScheduleTable({ rows }) {
  return <Paper className="report-table-paper" variant="outlined" sx={{ overflowX: 'auto' }}><Table className="report-table" size="small"><TableHead><TableRow>
    <TableCell>Equipment</TableCell><TableCell>Name</TableCell><TableCell>Location</TableCell><TableCell>Frequency</TableCell><TableCell>Next AMC</TableCell><TableCell>Inspection history</TableCell><TableCell>Status</TableCell>
  </TableRow></TableHead><TableBody>
    {rows.map((item) => <TableRow key={item.id}>
      <TableCell>{equipmentLabel(item)}</TableCell><TableCell>{item.name ?? '-'}</TableCell><TableCell>{locationLabel(item)}</TableCell><TableCell>{item.amc_frequency ?? '-'}</TableCell><TableCell>{item.next_amc_date ?? '-'}</TableCell><TableCell><InspectionHistoryDialog equipment={item} /></TableCell><TableCell><Chip size="small" label={item.scheduleStatus} color={item.scheduleStatus === 'overdue' ? 'error' : item.scheduleStatus === 'pending' ? 'warning' : 'success'} /></TableCell>
    </TableRow>)}
    {rows.length === 0 && <TableRow><TableCell colSpan={7}>No records found.</TableCell></TableRow>}
  </TableBody></Table></Paper>;
}

function CompletedTable({ rows, nokOnly = false }) {
  return <Paper className="report-table-paper" variant="outlined" sx={{ overflowX: 'auto' }}><Table className="report-table" size="small"><TableHead><TableRow>
    <TableCell>Date</TableCell><TableCell>Equipment</TableCell><TableCell>Template</TableCell><TableCell>Technician</TableCell><TableCell>Action</TableCell>
  </TableRow></TableHead><TableBody>
    {rows.map((item) => <TableRow key={item.id}>
      <TableCell>{item.inspection_date}</TableCell><TableCell>{item.equipment?.asset_id ?? (item.equipment ? `${item.equipment.equipment_type_code}/${item.equipment.unit_number}` : '-')}</TableCell><TableCell>{item.form_templates?.name ?? '-'}</TableCell><TableCell>{item.profiles?.name ?? '-'}</TableCell><TableCell><a href={`/reports/${item.id}`}>View</a></TableCell>
    </TableRow>)}
    {rows.length === 0 && <TableRow><TableCell colSpan={5}>{nokOnly ? 'No N/OK checklist results found.' : 'No completed inspections found.'}</TableCell></TableRow>}
  </TableBody></Table></Paper>;
}

export default function InspectionReports({ reportData }) {
  const [tab, setTab] = useState('summary');
  const [location, setLocation] = useState('all');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [summaryLocation, setSummaryLocation] = useState('all');
  const selectedRows = tab === 'equipment' ? reportData.equipment : tab === 'completed' ? reportData.completed : tab === 'pending' ? reportData.pending : tab === 'overdue' ? reportData.overdue : reportData.nok;
  const locations = [...new Set([...reportData.equipment, ...reportData.nok].map(locationLabel).filter((value) => value !== '-'))].sort();
  const filteredRows = selectedRows.filter((item) => {
    const equipment = tab === 'equipment' || tab === 'pending' || tab === 'overdue' ? equipmentLabel(item) : item.equipment?.asset_id ?? '';
    const text = [equipment, item.name, item.amc_frequency, item.inspection_date, item.profiles?.name, item.form_templates?.name, locationLabel(item)].filter(Boolean).join(' ').toLowerCase();
    const inspectionDates = tab === 'equipment' || tab === 'pending' || tab === 'overdue'
      ? item.history.map((inspection) => inspection.inspection_date)
      : [item.inspection_date];
    const matchesDateRange = inspectionDates.some((inspectionDate) =>
      inspectionDate && (!fromDate || inspectionDate >= fromDate) && (!toDate || inspectionDate <= toDate),
    );
    const matchesLocation = !['equipment', 'nok'].includes(tab) || location === 'all' || locationLabel(item) === location;
    return (!search || text.includes(search.toLowerCase())) && (!fromDate && !toDate || matchesDateRange) && matchesLocation && (tab !== 'equipment' || status === 'all' || item.scheduleStatus === status);
  });
  const visibleRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  function exportPdf() {
    setPage(0);
    setRowsPerPage(Math.max(filteredRows.length, 1));
    window.setTimeout(() => printReport(`${tab} inspection report`, 'print-consolidated-report'), 0);
  }
  function exportCurrent() {
    exportCsv(`${tab}-inspection-report.csv`, ['Date', 'Equipment', 'Location', 'Status'], filteredRows.map((item) => [item.inspection_date ?? item.next_amc_date, tab === 'equipment' ? equipmentLabel(item) : item.equipment?.asset_id, locationLabel(item), item.scheduleStatus ?? 'completed']));
  }

  const period = fromDate && toDate
    ? `${fromDate} to ${toDate}`
    : fromDate
      ? `From ${fromDate}`
      : toDate
        ? `Until ${toDate}`
        : formatReportPeriod(reportData.completed.map((submission) => submission.inspection_date));
  const descriptionByTab = {
    summary: 'Summary of completed inspections and maintenance requirements.',
    equipment: 'Equipment-wise AMC schedule, location, and inspection history.',
    completed: 'Completed inspection submissions across all equipment.',
    pending: 'Equipment with inspections due within the active schedule.',
    overdue: 'Equipment with inspections past their scheduled AMC date.',
    nok: 'Inspection submissions containing N/OK checklist results.',
  };

  return <Stack spacing={2}>
    <ReportHeader
      title={tab === 'summary' ? 'Inspection Summary Report' : 'Consolidated Inspection Report'}
      description={descriptionByTab[tab]}
      period={period}
      siteLocation={tab === 'summary'
        ? summaryLocation === 'all' ? 'All sites / locations' : summaryLocation
        : ['equipment', 'nok'].includes(tab) && location !== 'all' ? location : 'All sites / locations'}
    />
    <Tabs value={tab} onChange={(_, value) => { setTab(value); setPage(0); }} variant="scrollable">
      <Tab value="summary" label="Summary" /><Tab value="equipment" label="Equipment wise" /><Tab value="completed" label="Completed" /><Tab value="pending" label="Pending" /><Tab value="overdue" label="Overdue" /><Tab value="nok" label="N/OK checklist" />
    </Tabs>
    {tab === 'summary' && <SummaryReport submissions={reportData.completed} onLocationChange={setSummaryLocation} />}
    {tab !== 'summary' && <>
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
      <TextField label="Search report" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Equipment, date, technician" fullWidth />
      <TextField type="date" label="From date" value={fromDate} onChange={(event) => { setFromDate(event.target.value); setPage(0); }} slotProps={{ inputLabel: { shrink: true } }} />
      <TextField type="date" label="To date" value={toDate} onChange={(event) => { setToDate(event.target.value); setPage(0); }} slotProps={{ inputLabel: { shrink: true } }} />
      {['equipment', 'nok'].includes(tab) && <TextField select label="Location" value={location} onChange={(event) => { setLocation(event.target.value); setPage(0); }} sx={{ minWidth: 220 }}><MenuItem value="all">All locations</MenuItem>{locations.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField>}
      {tab === 'equipment' && <TextField select label="Status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(0); }} sx={{ minWidth: 160 }}><MenuItem value="all">All statuses</MenuItem><MenuItem value="pending">Pending</MenuItem><MenuItem value="overdue">Overdue</MenuItem><MenuItem value="completed">Completed</MenuItem></TextField>}
    </Stack>
    <Stack className="report-print-control" direction="row" spacing={1} sx={{ alignSelf: 'flex-start' }}>
      {/* <Button variant="outlined" onClick={exportCurrent}>Export CSV</Button> */}
      <Button variant="outlined" onClick={exportPdf}>Export PDF</Button>
    </Stack>
    <Typography color="text.secondary">Showing {visibleRows.length} of {filteredRows.length} records.</Typography>
    {tab === 'equipment' && <><Typography color="text.secondary">Complete AMC schedule and inspection history by equipment.</Typography><ScheduleTable rows={visibleRows} /></>}
    {tab === 'completed' && <CompletedTable rows={visibleRows} />}
    {tab === 'pending' && <ScheduleTable rows={visibleRows} />}
    {tab === 'overdue' && <ScheduleTable rows={visibleRows} />}
    {tab === 'nok' && <CompletedTable rows={visibleRows} nokOnly />}
    <TablePagination component="div" count={filteredRows.length} page={page} onPageChange={(_, nextPage) => setPage(nextPage)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(0); }} rowsPerPageOptions={[10, 25, 50]} />
    </>}
  </Stack>;
}
