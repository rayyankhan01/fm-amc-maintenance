"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { resolveMaintenanceIssue } from "@/features/forms/api";
import { Box, TextField, Button, Alert, Stack } from "@mui/material";

export default function ResolveIssueForm({ issueId, technicianId }) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!comment.trim()) {
      setError("Enter a comment describing what was done.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      await resolveMaintenanceIssue(supabase, issueId, {
        resolvedBy: technicianId,
        comment: comment.trim(),
      });
      router.refresh();
    } catch (submitError) {
      setError(submitError.message ?? "Failed to resolve issue.");
      setSubmitting(false);
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={2}>
        <TextField
          label="What was done to fix this?"
          required
          multiline
          minRows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        {error && <Alert severity="error">{error}</Alert>}
        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? "Saving..." : "Mark Resolved"}
        </Button>
      </Stack>
    </Box>
  );
}
