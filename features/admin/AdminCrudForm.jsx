'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Stack, TextField } from '@mui/material';

export default function AdminCrudForm({ action, initialValues, fields, redirectTo, submitLabel = 'Save' }) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await action(values);
      router.push(redirectTo);
      router.refresh();
    } catch (actionError) {
      setError(actionError.message ?? 'Unable to save record.');
      setSaving(false);
    }
  }

  return (
    <Stack component="form" onSubmit={handleSubmit} spacing={2}>
      {fields.map((field) => (
        <TextField key={field.name} label={field.label} required={field.required !== false} type={field.type ?? 'text'} value={values[field.name] ?? ''} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} />
      ))}
      {error && <Alert severity="error">{error}</Alert>}
      <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving...' : submitLabel}</Button>
    </Stack>
  );
}
