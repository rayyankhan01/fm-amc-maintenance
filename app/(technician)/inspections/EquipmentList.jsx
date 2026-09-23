"use client";

import Link from "next/link";
import {
  List,
  ListItemButton,
  ListItemText,
  Chip,
  Typography,
  Paper,
  TextField,
  Box,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { useMemo, useState } from "react";

/**
 * @param {{ equipment: Array<{
 *   id: string,
 *   equipment_type_code: string,
 *   unit_number: number,
 *   name: string | null,
 *   equipment_type: string,
 *   status: string,
 *   locations: { site_code: string, room_area: string } | null,
 * }> }} props
 */

function renderEquipmentList(items) {
  if (items.length === 0) {
    return <Typography>No equipment found</Typography>;
  }
  return (
    <Paper>
      <List disablePadding>
        {items.map((item) => {
          const assetId = `${item.locations?.site_code ?? "?"}/${item.equipment_type_code}/${item.unit_number}`;
          return (
            <ListItemButton
              key={item.id}
              component={Link}
              href={`/inspections/${item.id}`}
              divider
            >
              <ListItemText
                primary={item.name ?? item.equipment_type}
                secondary={`${assetId}· ${item.locations?.room_area ?? ""}`}
              />
              <Chip label={item.status} size="small" />
            </ListItemButton>
          );
        })}
      </List>
    </Paper>
  );
}

export default function EquipmentList({
  equipment,
  equipmentTypes,
  submissions,
}) {
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const filteredEquipment = useMemo(() => {
    if (!selectedTypeId) return equipment;
    return equipment.filter(
      (item) => item.equipment_type_id === selectedTypeId,
    );
  }, [equipment, selectedTypeId]);
  //filtering though the equipments to see whether the
  //submissions table has a entry with the matching equipment id
  const pendingEquipment = filteredEquipment.filter(
    (item) => !submissions.has(item.id),
  );
  const submittedEquipment = filteredEquipment.filter((item) =>
    submissions.has(item.id),
  );
  if (equipment.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
        No equipment found.
      </Typography>
    );
  }

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <TextField
          select
          label="Equipment Type"
          fullWidth
          value={selectedTypeId}
          onChange={(e) => setSelectedTypeId(e.target.value)}
        >
          <MenuItem value="">All Types</MenuItem>
          {equipmentTypes.map((type) => (
            <MenuItem key={type.id} value={type.id}>
              {type.name}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {/* {filteredEquipment.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
          No equipment found.
        </Typography>
      ) : (
        <Paper variant="outlined">
          <List disablePadding>
            {filteredEquipment.map((item) => {
              const assetId = `${item.locations?.site_code ?? "?"}/${item.equipment_type_code}/${item.unit_number}`;

              return (
                <ListItemButton
                  key={item.id}
                  component={Link}
                  href={`/inspections/${item.id}`}
                  divider
                >
                  <ListItemText
                    primary={item.name ?? item.equipment_type}
                    secondary={`${assetId} · ${item.locations?.room_area ?? ""}`}
                  />
                  <Chip label={item.status} size="small" />
                </ListItemButton>
              );
            })}
          </List>
        </Paper>
      )} */}

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography>Pending ({pendingEquipment.length})</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {renderEquipmentList(pendingEquipment)}
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography>Submitted ({submittedEquipment.length})</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {renderEquipmentList(submittedEquipment)}
        </AccordionDetails>
      </Accordion>
    </>
  );
}
