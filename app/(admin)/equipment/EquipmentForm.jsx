"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getNextUnitNumber } from "@/features/equipment/api";
import { Alert, Button, MenuItem, Stack, TextField } from "@mui/material";

export default function EquipmentForm({
  action,
  initialValues,
  equipmentTypes,
  statuses,
  frequencies,
  submitLabel,
}) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [checkingUnitNumber, setCheckingUnitNumber] = useState(false);

  function update(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function handleTypeCodeBlur() {
    if (values.id) return; // don't recalculate when editing existing equipment
    const code = values.equipment_type_code?.trim();
    if (!code) return;

    setCheckingUnitNumber(true);
    try {
      const supabase = createClient();
      const next = await getNextUnitNumber(supabase, code);
      update("unit_number", next);
    } finally {
      setCheckingUnitNumber(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await action(values);
      router.push("/equipment");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError.code === "23505"
          ? "An equipment record with this type code and unit number already exists."
          : (submitError.message ?? "Unable to save equipment."),
      );
      setSaving(false);
    }
  }

  return (
    <Stack component="form" onSubmit={handleSubmit} spacing={2}>
      <TextField
        select
        required
        label="Equipment category"
        value={values.equipment_type_id}
        onChange={(event) => {
          const type = equipmentTypes.find(
            (item) => item.id === event.target.value,
          );
          update("equipment_type_id", event.target.value);
          update("equipment_type", type?.code ?? "");
        }}
      >
        {equipmentTypes.map((type) => (
          <MenuItem key={type.id} value={type.id}>
            {type.name}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        required
        label="Equipment type"
        value={values.equipment_type}
        onChange={(event) => update("equipment_type", event.target.value)}
        helperText="The type code used by the inspection template."
      />
      <TextField
        required
        label="Equipment type code"
        value={values.equipment_type_code}
        onChange={(event) => update("equipment_type_code", event.target.value)}
        onBlur={handleTypeCodeBlur}
      />
      <TextField
        required
        type="number"
        label="Unit number"
        value={checkingUnitNumber ? "Calculating..." : values.unit_number}
        onChange={(event) => update("unit_number", event.target.value)}
      />
      <TextField
        required
        label="Equipment name"
        value={values.name}
        onChange={(event) => update("name", event.target.value)}
      />
      <TextField
        required
        label="Site name"
        value={values.site_name}
        onChange={(event) => update("site_name", event.target.value)}
      />
      <TextField
        required
        label="Location / site code"
        value={values.site_code}
        onChange={(event) => update("site_code", event.target.value)}
      />
      <TextField
        required
        label="Room/area"
        value={values.room_area}
        onChange={(event) => update("room_area", event.target.value)}
      />
      <TextField
        select
        required
        label="Equipment status"
        value={values.status}
        onChange={(event) => update("status", event.target.value)}
      >
        {statuses.map((status) => (
          <MenuItem key={status.code} value={status.code}>
            {status.label}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        required
        label="AMC preventive maintenance frequency"
        value={values.amc_frequency}
        onChange={(event) => update("amc_frequency", event.target.value)}
      >
        {frequencies.map((frequency) => (
          <MenuItem key={frequency.code} value={frequency.code}>
            {frequency.label}
          </MenuItem>
        ))}
      </TextField>
      {error && <Alert severity="error">{error}</Alert>}
      <Button type="submit" variant="contained" disabled={saving}>
        {saving ? "Saving..." : submitLabel}
      </Button>
    </Stack>
  );
}
