'use client';

import { useMemo, useState } from 'react';
import {
  Button,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  TablePagination,
} from '@mui/material';
import { exportCsv } from './reportUtils';
import { printReport } from './reportPrint';

function reportEquipment(submission) {
  return submission.equipment
    ? submission.equipment.asset_id ?? `${submission.equipment.equipment_type_code}/${submission.equipment.unit_number}`
    : '-';
}

function reportLocation(submission) {
  const location = submission.equipment?.locations;
  if (!location) return '-';
  return [location.site_name, location.site_code, location.room_area].filter(Boolean).join(' / ') || '-';
}

export default function ReportsTable({ submissions }) {
  const [search, setSearch] = useState('');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [technicianFilter, setTechnicianFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const templates = useMemo(
    () => [...new Set(submissions.map((item) => item.form_templates?.name).filter(Boolean))].sort(),
    [submissions]
  );
  const technicians = useMemo(
    () => [...new Set(submissions.map((item) => item.profiles?.name).filter(Boolean))].sort(),
    [submissions]
  );
  const locations = useMemo(
    () => [...new Set(submissions.map((item) => reportLocation(item)).filter((location) => location !== '-'))].sort(),
    [submissions]
  );

  const filteredSubmissions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return submissions.filter((submission) => {
      const template = submission.form_templates?.name ?? '';
      const technician = submission.profiles?.name ?? '';
      const equipment = reportEquipment(submission);
      const location = reportLocation(submission);
      const matchesSearch = !normalizedSearch || [
        submission.inspection_date,
        template,
        technician,
        equipment,
        location,
      ].some((value) => value.toLowerCase().includes(normalizedSearch));

      return matchesSearch
        && (templateFilter === 'all' || template === templateFilter)
        && (technicianFilter === 'all' || technician === technicianFilter)
          && (locationFilter === 'all' || location === locationFilter)
        && (!dateFilter || submission.inspection_date === dateFilter);
    });
        }, [dateFilter, locationFilter, search, submissions, templateFilter, technicianFilter]);
        const visibleSubmissions = filteredSubmissions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
        function exportPdf() {
          setPage(0);
          setRowsPerPage(Math.max(filteredSubmissions.length, 1));
          window.setTimeout(() => printReport('Latest inspection report', 'print-latest-report'), 0);
        }
        function resetPage() { setPage(0); }
        function exportReports() {
          exportCsv('inspection-reports.csv', ['Date', 'Template', 'Equipment', 'Location', 'Technician'], filteredSubmissions.map((item) => [item.inspection_date, item.form_templates?.name, reportEquipment(item), reportLocation(item), item.profiles?.name]));
        }

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <TextField
          label="Search reports"
          placeholder="Date, template, equipment, technician"
          value={search}
          onChange={(event) => { setSearch(event.target.value); resetPage(); }}
          fullWidth
        />
        <TextField
          select
          label="Template"
          value={templateFilter}
          onChange={(event) => { setTemplateFilter(event.target.value); resetPage(); }}
          sx={{ minWidth: { md: 220 } }}
        >
          <MenuItem value="all">All templates</MenuItem>
          {templates.map((template) => <MenuItem key={template} value={template}>{template}</MenuItem>)}
        </TextField>
        <TextField
          select
          label="Technician"
          value={technicianFilter}
          onChange={(event) => { setTechnicianFilter(event.target.value); resetPage(); }}
          sx={{ minWidth: { md: 180 } }}
        >
          <MenuItem value="all">All technicians</MenuItem>
          {technicians.map((technician) => <MenuItem key={technician} value={technician}>{technician}</MenuItem>)}
        </TextField>
        <TextField
          select
          label="Location"
          value={locationFilter}
          onChange={(event) => { setLocationFilter(event.target.value); resetPage(); }}
          sx={{ minWidth: { md: 220 } }}
        >
          <MenuItem value="all">All locations</MenuItem>
          {locations.map((location) => <MenuItem key={location} value={location}>{location}</MenuItem>)}
        </TextField>
        <TextField
          type="date"
          label="Inspection date"
          value={dateFilter}
          onChange={(event) => { setDateFilter(event.target.value); resetPage(); }}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ minWidth: { md: 170 } }}
        />
      </Stack>
      <Stack className="report-print-control" direction="row" spacing={1} sx={{ alignSelf: 'flex-start' }}>
        {/* <Button variant="outlined" onClick={exportReports}>Export CSV</Button> */}
        <Button variant="outlined" onClick={exportPdf}>Export PDF</Button>
      </Stack>

      <Typography variant="body2" color="text.secondary">
        Showing {filteredSubmissions.length} of {submissions.length} reports
      </Typography>

      <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Template</TableCell>
              <TableCell>Equipment</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Technician</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleSubmissions.map((submission) => (
              <TableRow key={submission.id}>
                <TableCell>{submission.inspection_date}</TableCell>
                <TableCell>{submission.form_templates?.name ?? '-'}</TableCell>
                <TableCell>{reportEquipment(submission)}</TableCell>
                <TableCell>{reportLocation(submission)}</TableCell>
                <TableCell>{submission.profiles?.name ?? '-'}</TableCell>
                <TableCell><Button href={`/reports/${submission.id}`}>View</Button></TableCell>
              </TableRow>
            ))}
            {visibleSubmissions.length === 0 && (
              <TableRow><TableCell colSpan={6}><Typography color="text.secondary">No reports match the selected filters.</Typography></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
      <TablePagination component="div" count={filteredSubmissions.length} page={page} onPageChange={(_, nextPage) => setPage(nextPage)} rowsPerPage={rowsPerPage} onRowsPerPageChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(0); }} rowsPerPageOptions={[10, 25, 50]} />
    </Stack>
  );
}
