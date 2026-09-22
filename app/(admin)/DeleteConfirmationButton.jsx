'use client';

import { useRef, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

export default function DeleteConfirmationButton({
  actionLabel = 'Delete',
  title,
  message,
  color = 'error',
}) {
  const formRef = useRef(null);
  const [open, setOpen] = useState(false);

  function openConfirmation(event) {
    formRef.current = event.currentTarget.form;
    setOpen(true);
  }

  function confirmAction() {
    setOpen(false);
    formRef.current?.requestSubmit();
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={confirmAction} color={color} variant="contained" autoFocus>
            {actionLabel}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
