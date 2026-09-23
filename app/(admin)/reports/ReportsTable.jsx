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
} from '@mui/material';

function reportEquipment(submission) {
  return submission.equipment
    ? `${submission.equipment.equipment_type_code}/${submission.equipment.unit_number}`
    : '-';
}

export default function ReportsTable({ submissions }) {
  const [search, setSearch] = useState('');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [technicianFilter, setTechnicianFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  const templates = useMemo(
    () => [...new Set(submissions.map((item) => item.form_templates?.name).filter(Boolean))].sort(),
    [submissions]
  );
  const technicians = useMemo(
    () => [...new Set(submissions.map((item) => item.profiles?.name).filter(Boolean))].sort(),
    [submissions]
  );

  const filteredSubmissions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return submissions.filter((submission) => {
      const template = submission.form_templates?.name ?? '';
      const technician = submission.profiles?.name ?? '';
      const equipment = reportEquipment(submission);
      const matchesSearch = !normalizedSearch || [
        submission.inspection_date,
        template,
        technician,
        equipment,
      ].some((value) => value.toLowerCase().includes(normalizedSearch));

      return matchesSearch
        && (templateFilter === 'all' || template === templateFilter)
        && (technicianFilter === 'all' || technician === technicianFilter)
        && (!dateFilter || submission.inspection_date === dateFilter);
    });
  }, [dateFilter, search, submissions, templateFilter, technicianFilter]);

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <TextField
          label="Search reports"
          placeholder="Date, template, equipment, technician"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          fullWidth
        />
        <TextField
          select
          label="Template"
          value={templateFilter}
          onChange={(event) => setTemplateFilter(event.target.value)}
          sx={{ minWidth: { md: 220 } }}
        >
          <MenuItem value="all">All templates</MenuItem>
          {templates.map((template) => <MenuItem key={template} value={template}>{template}</MenuItem>)}
        </TextField>
        <TextField
          select
          label="Technician"
          value={technicianFilter}
          onChange={(event) => setTechnicianFilter(event.target.value)}
          sx={{ minWidth: { md: 180 } }}
        >
          <MenuItem value="all">All technicians</MenuItem>
          {technicians.map((technician) => <MenuItem key={technician} value={technician}>{technician}</MenuItem>)}
        </TextField>
        <TextField
          type="date"
          label="Inspection date"
          value={dateFilter}
          onChange={(event) => setDateFilter(event.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ minWidth: { md: 170 } }}
        />
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
              <TableCell>Technician</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSubmissions.map((submission) => (
              <TableRow key={submission.id}>
                <TableCell>{submission.inspection_date}</TableCell>
                <TableCell>{submission.form_templates?.name ?? '-'}</TableCell>
                <TableCell>{reportEquipment(submission)}</TableCell>
                <TableCell>{submission.profiles?.name ?? '-'}</TableCell>
                <TableCell><Button href={`/reports/${submission.id}`}>View</Button></TableCell>
              </TableRow>
            ))}
            {filteredSubmissions.length === 0 && (
              <TableRow><TableCell colSpan={5}><Typography color="text.secondary">No reports match the selected filters.</Typography></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  );
}
