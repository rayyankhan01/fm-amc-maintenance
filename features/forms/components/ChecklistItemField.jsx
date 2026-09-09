'use client';

import { Box, Typography, ToggleButtonGroup, ToggleButton, TextField } from '@mui/material';

const RESULTS = [
  { value: 'OK', label: 'OK', color: 'success' },
  { value: 'N_OK', label: 'NOT OK', color: 'error' },
  { value: 'N_A', label: 'N/A', color: 'inherit' },
];

/**
 * One checklist row: label + OK/N_OK/N_A selector, with a remarks box
 * that appears when the result is N_OK.
 * @param {{
 *   field: import('../types').FormField,
 *   value: { result: string | null, remarks: string | null },
 *   onChange: (next: { result: string | null, remarks: string | null }) => void,
 * }} props
 */
export default function ChecklistItemField({ field, value, onChange }) {
  const result = value?.result ?? null;
  const remarks = value?.remarks ?? '';

  return (
    <Box sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant="body2" sx={{ mb: 1 }}>
        {field.label}
        {field.is_mandatory && (
          <Typography component="span" color="error">
            {' *'}
          </Typography>
        )}
      </Typography>

      <ToggleButtonGroup
        value={result}
        exclusive
        size="small"
        onChange={(e, next) => next && onChange({ result: next, remarks })}
      >
        {RESULTS.map((option) => (
          <ToggleButton key={option.value} value={option.value} color={option.color}>
            {option.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {result === 'N_OK' && (
        <TextField
          value={remarks}
          onChange={(e) => onChange({ result, remarks: e.target.value })}
          placeholder="Remarks (required)"
          fullWidth
          multiline
          minRows={2}
          size="small"
          sx={{ mt: 1.5 }}
        />
      )}
    </Box>
  );
}
