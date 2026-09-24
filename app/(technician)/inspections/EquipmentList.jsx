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

//helper function to get asset id in renderEquipmentList and in the search Function
function getAssetId(item) {
  return `${item.locations?.site_code ?? "?"}/${item.equipment_type_code}/${item.unit_number}`;
}
function renderEquipmentList(items) {
  if (items.length === 0) {
    return <Typography>No equipment found</Typography>;
  }
  return (
    <Paper>
      <List disablePadding>
        {items.map((item) => {
          const assetId = getAssetId(item);
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
  const [searchText, setSearchText] = useState("");
  const filteredEquipment = useMemo(() => {
    const byType = selectedTypeId
      ? equipment.filter((item) => item.equipment_type_id === selectedTypeId)
      : equipment;

    if (!searchText.trim()) return byType;

    const query = searchText.trim().toLowerCase();
    return byType.filter((item) => {
      const assetId = getAssetId(item);
      return (
        assetId.toLowerCase().includes(query) ||
        (item.name ?? "").toLowerCase().includes(query)
      );
    });
  }, [equipment, selectedTypeId, searchText]);

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
          label="Search Asset"
          fullWidth
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setSelectedTypeId("");
          }}
          sx={{ mb: 2 }}
        />
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
