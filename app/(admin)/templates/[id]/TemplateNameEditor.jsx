"use client";

import { updateTemplateName } from "@/features/forms/api";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Stack, Button, TextField } from "@mui/material";
export default function TemplateNameEditor({ templateId, initialName }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim() || name === initialName) return;
    setSaving(true);
    try {
      const supabase = createClient();
      await updateTemplateName(supabase, templateId, name.trim());
      router.refresh();
    } finally {
      setSaving(false);
    }
  }
  return (
    <Stack>
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
