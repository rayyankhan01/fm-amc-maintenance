'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { submitInspection } from '../api';
import ChecklistItemField from './ChecklistItemField';
import SignaturePad from './SignaturePad';
import { Box, Typography, Paper, TextField, Alert, Button, Stack } from '@mui/material';

/**
 * Generic form renderer: reads a template's fields and renders whatever
 * it's given — checklist items (OK/N_OK/N_A + remarks) or header inputs
 * (text/date/select) — grouped by section, in sort_order.
 * @param {{
 *   template: import('../types').TemplateWithFields,
 *   equipment: { id: string },
 *   assetId: string,
 *   technician: { id: string, name: string } | null,
 * }} props
 */
export default function ChecklistForm({ template, equipment, assetId, technician }) {
  const router = useRouter();
  const [answers, setAnswers] = useState({});
  const [signature, setSignature] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const sections = useMemo(() => {
    const headerFields = template.fields.filter((f) => f.field_type !== 'checklist_item');
    const checklistFields = template.fields.filter((f) => f.field_type === 'checklist_item');

    const grouped = [];
    for (const field of checklistFields) {
      const last = grouped[grouped.length - 1];
      if (last && last.section === field.section) {
        last.fields.push(field);
      } else {
        grouped.push({ section: field.section, fields: [field] });
      }
    }

    return { headerFields, checklistSections: grouped };
  }, [template.fields]);

  function updateAnswer(fieldId, next) {
    setAnswers((prev) => ({ ...prev, [fieldId]: next }));
  }

  function validate() {
    for (const field of template.fields) {
      if (!field.is_mandatory) continue;
      const answer = answers[field.id];

      if (field.field_type === 'checklist_item') {
        if (!answer?.result) return `"${field.label}" is required.`;
        if (answer.result === 'N_OK' && !answer.remarks?.trim()) {
          return `Remarks are required for "${field.label}" since it's marked NOT OK.`;
        }
      } else if (!answer?.value?.trim()) {
        return `"${field.label}" is required.`;
      }
    }

    if (!signature) return 'Technician signature is required.';
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const supabase = createClient();
      const responses = template.fields.map((field) => {
        const answer = answers[field.id] ?? {};
        return {
          field_id: field.id,
          result: field.field_type === 'checklist_item' ? answer.result ?? null : null,
          value: field.field_type !== 'checklist_item' ? answer.value ?? null : null,
          remarks: field.field_type === 'checklist_item' ? answer.remarks ?? null : null,
        };
      });

      await submitInspection(supabase, {
        template_id: template.id,
        equipment_id: equipment.id,
        technician_id: technician?.id,
        inspection_date: new Date().toISOString().slice(0, 10),
        technician_signature: signature,
        responses,
      });

      router.push('/inspections');
      router.refresh();
    } catch (submitError) {
      setError(submitError.message ?? 'Failed to submit inspection.');
      setSubmitting(false);
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h5">{template.name}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {assetId} · {technician?.name ?? 'Unknown technician'} ·{' '}
        {new Date().toLocaleDateString()}
      </Typography>

      {sections.headerFields.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Stack spacing={2}>
            {sections.headerFields.map((field) => (
              <TextField
                key={field.id}
                label={field.label}
                required={field.is_mandatory}
                type={field.field_type === 'date' ? 'date' : 'text'}
                value={answers[field.id]?.value ?? ''}
                onChange={(e) => updateAnswer(field.id, { value: e.target.value })}
                fullWidth
                slotProps={field.field_type === 'date' ? { inputLabel: { shrink: true } } : undefined}
              />
            ))}
          </Stack>
        </Paper>
      )}

      {sections.checklistSections.map((group) => (
        <Paper key={group.section} variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            {group.section}
          </Typography>
          {group.fields.map((field) => (
            <ChecklistItemField
              key={field.id}
              field={field}
              value={answers[field.id]}
              onChange={(next) => updateAnswer(field.id, next)}
            />
          ))}
        </Paper>
      ))}

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Technician Signature
        </Typography>
        <SignaturePad onChange={setSignature} />
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Button type="submit" variant="contained" fullWidth disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit Inspection'}
      </Button>
    </Box>
  );
}
