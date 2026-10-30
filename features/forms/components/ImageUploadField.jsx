"use client";

import { useRef, useState } from "react";
import {
  Box,
  CircularProgress,
  Input,
  Button,
  Alert,
  Typography,
} from "@mui/material";
import { createClient } from "@/lib/supabase/client";

export default function ImageUploadField({ onChange }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const supabase = createClient();
    const path = `${crypto.randomUUID()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("inspection-photos")
      .upload(path, file);

    if (uploadError) {
      setError(uploadError.message);
      setUploading(null);
      return;
    }

    const { data } = supabase.storage
      .from("inspection-photos")
      .getPublicUrl(path);

    setPreviewUrl(data.publicUrl);
    onChange(data.publicUrl);
    setUploading(false);
  }

  function handleClear() {
    setPreviewUrl(null);
    onChange();
    if (fileInputRef.current) fileInputRef.current.value = "";
  }
  return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFileChange}
      />
      {previewUrl ? (
        <Box>
          <img
            src={previewUrl}
            alt="uploaded"
            style={{ maxWidth: "100%", maxHeight: 200 }}
          />
          {label && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              {label}
            </Typography>
          )}
          <Button size="small" onClick={handleClear}>
            Remove
          </Button>
        </Box>
      ) : (
        <Button
          variant="outlined"
          disabled={uploading}
          onClick={() => fileInputRef.current.click()}
        >
          {uploading ? <CircularProgress size={20} /> : "Upload Image"}
        </Button>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
