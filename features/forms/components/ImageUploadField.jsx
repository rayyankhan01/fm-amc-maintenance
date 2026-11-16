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
import { userError } from "@/lib/userError";

export default function ImageUploadField({ label, onChange }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const supabase = createClient();
      const path = `${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("inspection-photos")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("inspection-photos")
        .getPublicUrl(path);
      setPreviewUrl(data.publicUrl);
      onChange(data.publicUrl);
    } catch (uploadError) {
      setError(userError(uploadError, "Unable to upload the image. Please check your connection and try again."));
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setUploading(false);
    }
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
      {label && (
        <Typography variant="body2" sx={{ mb: 1 }}>
          {label}
        </Typography>
      )}
      {previewUrl ? (
        <Box sx={{ textAlign: "left" }}>
          <img
            src={previewUrl}
            alt="uploaded"
            style={{ maxWidth: "100%", maxHeight: 200, display: "block" }}
          />
          <Button
            size="small"
            variant="contained"
            onClick={handleClear}
            sx={{ mt: 1 }}
          >
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
