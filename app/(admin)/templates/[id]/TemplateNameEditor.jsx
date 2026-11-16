"use client";

import { updateTemplateName } from "@/features/forms/api";
import { createClient } from "@/lib/supabase/client";
import { userError } from "@/lib/userError";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Stack, Button, TextField, Alert } from "@mui/material";
export default function TemplateNameEditor({ templateId, initialName }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSave() {
    if (!name.trim() || name === initialName) return;
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      await updateTemplateName(supabase, templateId, name.trim());
      router.refresh();
    } catch (saveError) {
      setError(userError(saveError, "Unable to save the template name. Please try again."));
    } finally {
      setSaving(false);
    }
  }
  return (
    <Stack>
      {error && <Alert severity="error">{error}</Alert>}
      <TextField
        size="small"
        variant="standard"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Button
        size="small"
        onClick={handleSave}
        disabled={saving || name === initialName}
      >
        {saving ? "Saving..." : "Save"}
      </Button>
    </Stack>
  );
}
