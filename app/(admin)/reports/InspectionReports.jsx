'use client';

import { useState } from 'react';
import { Chip, MenuItem, Paper, Stack, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, TextField, Typography } from '@mui/material';

function equipmentLabel(item) {
  return item.asset_id ?? `${item.equipment_type_code}/${item.unit_number}`;
}

function locationLabel(item) {
  const location = item.locations;
  return location ? [location.site_name, location.site_code, location.room_area].filter(Boolean).join(' / ') : '-';
}

function ScheduleTable({ rows }) {
  return <Paper variant="outlined" sx={{ overflowX: 'auto' }}><Table size="small"><TableHead><TableRow>
    <TableCell>Equipment</TableCell><TableCell>Name</TableCell><TableCell>Location</TableCell><TableCell>Frequency</TableCell><TableCell>Next AMC</TableCell><TableCell>Inspection history</TableCell><TableCell>Status</TableCell>
  </TableRow></TableHead><TableBody>
    {rows.map((item) => <TableRow key={item.id}>
      <TableCell>{equipmentLabel(item)}</TableCell><TableCell>{item.name ?? '-'}</TableCell><TableCell>{locationLabel(item)}</TableCell><TableCell>{item.amc_frequency ?? '-'}</TableCell><TableCell>{item.next_amc_date ?? '-'}</TableCell><TableCell>{item.history.map((inspection) => inspection.inspection_date).join(', ') || '-'}</TableCell><TableCell><Chip size="small" label={item.scheduleStatus} color={item.scheduleStatus === 'overdue' ? 'error' : item.scheduleStatus === 'pending' ? 'warning' : 'success'} /></TableCell>
    </TableRow>)}
    {rows.length === 0 && <TableRow><TableCell colSpan={7}>No records found.</TableCell></TableRow>}
  </TableBody></Table></Paper>;
}

function CompletedTable({ rows, nokOnly = false }) {
  return <Paper variant="outlined" sx={{ overflowX: 'auto' }}><Table size="small"><TableHead><TableRow>
    <TableCell>Date</TableCell><TableCell>Equipment</TableCell><TableCell>Template</TableCell><TableCell>Technician</TableCell><TableCell>Action</TableCell>
  </TableRow></TableHead><TableBody>
    {rows.map((item) => <TableRow key={item.id}>
      <TableCell>{item.inspection_date}</TableCell><TableCell>{item.equipment?.asset_id ?? (item.equipment ? `${item.equipment.equipment_type_code}/${item.equipment.unit_number}` : '-')}</TableCell><TableCell>{item.form_templates?.name ?? '-'}</TableCell><TableCell>{item.profiles?.name ?? '-'}</TableCell><TableCell><a href={`/reports/${item.id}`}>View</a></TableCell>
    </TableRow>)}
    {rows.length === 0 && <TableRow><TableCell colSpan={5}>{nokOnly ? 'No N/OK checklist results found.' : 'No completed inspections found.'}</TableCell></TableRow>}
  </TableBody></Table></Paper>;
}

export default function InspectionReports({ reportData }) {
  const [tab, setTab] = useState('equipment');
  const [location, setLocation] = useState('all');
  const locations = [...new Set(reportData.equipment.map(locationLabel).filter((value) => value !== '-'))].sort();
  const filteredEquipment = reportData.equipment.filter((item) => location === 'all' || locationLabel(item) === location);

  return <Stack spacing={2}>
    <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable">
      <Tab value="equipment" label="Equipment wise" /><Tab value="completed" label="Completed (Priority 1)" /><Tab value="pending" label="Pending" /><Tab value="overdue" label="Overdue" /><Tab value="nok" label="N/OK checklist" />
    </Tabs>
    {tab === 'equipment' && <><TextField select label="Location" value={location} onChange={(event) => setLocation(event.target.value)} sx={{ maxWidth: 320 }}><MenuItem value="all">All locations</MenuItem>{locations.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField><Typography color="text.secondary">Complete AMC schedule and inspection history by equipment.</Typography><ScheduleTable rows={filteredEquipment} /></>}
    {tab === 'completed' && <CompletedTable rows={reportData.completed} />}
    {tab === 'pending' && <ScheduleTable rows={reportData.pending} />}
    {tab === 'overdue' && <ScheduleTable rows={reportData.overdue} />}
    {tab === 'nok' && <CompletedTable rows={reportData.nok} nokOnly />}
  </Stack>;
}
