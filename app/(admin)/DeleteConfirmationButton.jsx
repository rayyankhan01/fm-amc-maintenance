'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { userError } from '@/lib/userError';

export default function DeleteConfirmationButton({
  actionLabel = 'Delete',
  title,
  message,
  color = 'error',
  action,
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);

  function openConfirmation() {
    setError(null);
    setOpen(true);
  }

  async function confirmAction() {
    setPending(true);
    setError(null);
    try {
      const result = await action();
      if (result?.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    } catch (actionError) {
      setError(userError(actionError, `Unable to ${actionLabel.toLowerCase()} this record. Please try again.`));
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button type="button" color={color} onClick={openConfirmation}>
        {actionLabel}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} aria-labelledby="delete-confirmation-title">
        <DialogTitle id="delete-confirmation-title">{title ?? `${actionLabel} record?`}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {message ?? `Are you sure you want to ${actionLabel.toLowerCase()} this record? This action cannot be undone.`}
          </DialogContentText>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
          <Button onClick={confirmAction} color={color} variant="contained" autoFocus disabled={pending}>
            {pending ? 'Please wait...' : actionLabel}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
