import {
  Alert,
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

function responseText(field, response) {
  if (!response) return '-';
  if (field.field_type === 'checklist_item') {
    const resultLabels = { OK: 'OK', N_OK: 'Not OK', N_A: 'N/A' };
    return resultLabels[response.result] ?? response.result ?? '-';
  }
  return response.value || '-';
}

function resultColor(result) {
  if (result === 'OK') return 'success';
  if (result === 'N_OK') return 'error';
  if (result === 'N_A') return 'default';
  return 'default';
}

/**
 * Read-only renderer for a submitted form. The template controls the fields,
 * so AC inspection reports do not need a separate hard-coded component.
 */
export default function SubmissionViewer({ submission }) {
  const responseByField = new Map(
    (submission.form_responses ?? []).map((response) => [response.field_id, response])
  );
  const fields = submission.form_templates?.form_fields ?? [];
  const headerFields = fields.filter((field) => field.field_type !== 'checklist_item');
  const checklistFields = fields.filter((field) => field.field_type === 'checklist_item');
  const sections = [];

  for (const field of checklistFields) {
    const previous = sections[sections.length - 1];
    if (previous?.name === field.section) previous.fields.push(field);
    else sections.push({ name: field.section || 'Inspection checklist', fields: [field] });
  }

  const equipment = submission.equipment ?? {};
  const location = equipment.locations ?? {};
  const technician = submission.profiles?.name ?? '-';
  const assetId = equipment.id
    ? `${location.site_code ?? '?'}/${equipment.equipment_type_code ?? '?'}/${equipment.unit_number ?? '?'}`
    : '-';

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">{submission.form_templates?.name ?? 'Inspection report'}</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Submitted {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : '-'}
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Inspection details</Typography>
        <Stack spacing={1}>
          <Typography><strong>Asset ID:</strong> {assetId}</Typography>
          <Typography><strong>Equipment:</strong> {equipment.name || equipment.equipment_type || '-'}</Typography>
          <Typography><strong>Location:</strong> {location.site_name || location.site_code || '-'}{location.room_area ? `, ${location.room_area}` : ''}</Typography>
          <Typography><strong>Inspection date:</strong> {submission.inspection_date}</Typography>
          <Typography><strong>Technician:</strong> {technician}</Typography>
        </Stack>
      </Paper>

      {headerFields.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Inspection information</Typography>
          <Stack spacing={1}>
            {headerFields.map((field) => (
              <Typography key={field.id}>
                <strong>{field.label}:</strong> {responseText(field, responseByField.get(field.id))}
              </Typography>
            ))}
          </Stack>
        </Paper>
      )}

      {sections.map((section) => (
        <Paper variant="outlined" sx={{ overflow: 'hidden' }} key={section.name}>
          <Typography variant="h6" sx={{ p: 2 }}>{section.name}</Typography>
          <Divider />
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Inspection item</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Remarks</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {section.fields.map((field) => {
                const response = responseByField.get(field.id);
                return (
                  <TableRow key={field.id}>
                    <TableCell>{field.label}</TableCell>
                    <TableCell>
                      <Chip label={responseText(field, response)} color={resultColor(response?.result)} size="small" />
                    </TableCell>
                    <TableCell>{response?.remarks || '-'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      ))}

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Signatures</Typography>
        {submission.technician_signature ? (
          <Box>
            <Typography variant="body2" color="text.secondary">Technician</Typography>
            <Box component="img" src={submission.technician_signature} alt="Technician signature" sx={{ display: 'block', maxWidth: '100%', height: 100, objectFit: 'contain', objectPosition: 'left' }} />
          </Box>
        ) : <Alert severity="info">No technician signature recorded.</Alert>}
        {submission.supervisor_signature && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">Supervisor</Typography>
            <Box component="img" src={submission.supervisor_signature} alt="Supervisor signature" sx={{ display: 'block', maxWidth: '100%', height: 100, objectFit: 'contain', objectPosition: 'left' }} />
          </Box>
        )}
      </Paper>
    </Stack>
  );
}
