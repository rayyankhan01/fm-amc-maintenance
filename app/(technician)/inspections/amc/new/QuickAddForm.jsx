"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  createEquipment,
  findOrCreateLocation,
  getNextUnitNumber,
} from "@/features/equipment/api";
import { Box, TextField, MenuItem, Button, Alert, Stack } from "@mui/material";
export default function QuickAddForm({ equipmentTypes, sites }) {
  const router = useRouter();
  const [form, setForm] = useState({
    equipment_type_id: "",
    equipment_type_code: "",
    site_code: "",
    room_area: "",
  });

  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(null);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const selectedType = equipmentTypes.find(
      (t) => t.id === form.equipment_type_id,
    );
    if (!selectedType) {
      setError("Select an equipment type.");
      return;
    }
    if (!form.equipment_type_code.trim()) {
      setError("Equipment type code is required!");
      return;
    }
    if (!form.site_code.trim() || !form.room_area.trim()) {
      setError("Site and room area required!");
      return;
    }
    setSubmitting(true);
    try {
      const supabase = createClient();
      const code = form.equipment_type_code.trim();

      const [location_id, unit_number] = await Promise.all([
        findOrCreateLocation(supabase, {
          site_code: form.site_code.trim(),
          room_area: form.room_area.trim(),
        }),
        getNextUnitNumber(supabase, code),
      ]);

      const equipmentId = await createEquipment(supabase, {
        equipment_type_id: selectedType.id,
        equipment_type: selectedType.code,
        equipment_type_code: code,
        unit_number,
        name: null,
        location_id,
        status: "Operational",
      });

      router.push(`/inspections/amc/${equipmentId}`);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError.code === "23505"
          ? "Equipment type code + unit number combination already exists."
          : (submitError.message ?? "Failed to create equipment."),
      );
      setSubmitting(false);
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={2}>
        <TextField
          select
          required
          label="Equipment Type"
          value={form.equipment_type_id}
          onChange={(e) => update("equipment_type_id", e.target.value)}
        >
          {equipmentTypes.map((t) => (
            <MenuItem key={t.id} value={t.id}>
              {t.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          required
          label="Equipment Type Code"
          helperText="Short code used in the displayed asset ID, e.g. SPAC"
          value={form.equipment_type_code}
          onChange={(e) => update("equipment_type_code", e.target.value)}
        />

        <TextField
          select
          required
          label="Site"
          value={form.site_code}
          onChange={(e) => update("site_code", e.target.value)}
        >
          {sites.map((site) => (
            <MenuItem key={site.site_code} value={site.site_code}>
              {site.site_code}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          required
          label="Room"
          value={form.room_area}
          onChange={(e) => update("room_area", e.target.value)}
        />

        {error && <Alert severity="error">{error}</Alert>}

        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? "Creating..." : "Create & Inspect"}
        </Button>
      </Stack>
    </Box>
  );
}
