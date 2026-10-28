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
  Stack,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

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
  return (
    item.asset_id ??
    `${item.locations?.site_code ?? "?"}/${item.equipment_type_code}/${item.unit_number}`
  );
}
function renderEquipmentList(items, chipLabel, cancelledDates) {
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
              href={`/inspections/amc/${item.id}`}
              divider
            >
              <ListItemText
                primary={item.name ?? item.equipment_type}
                secondary={`${assetId}· ${item.locations?.room_area ? `Room ${item.locations.room_area}` : ""}`}
              />
              <Stack spacing={1}>
                <Chip label={chipLabel} size="small" color="primary" />
                {cancelledDates.has(item.id) && (
                  <Chip
                    label={`Cancelled - ${new Date(cancelledDates.get(item.id)).toLocaleDateString()}`}
                    size="small"
                    color="warning"
                  ></Chip>
                )}
              </Stack>
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
  completedIds,
  cancelledDates,
  locations,
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [selectedTypeId, setSelectedTypeId] = useState(
    searchParams.get("type") ?? "",
  );
  const [searchText, setSearchText] = useState(
    searchParams.get("search") ?? "",
  );
  const [selectedLocationId, setSelectedLocationId] = useState(
    searchParams.get("location") ?? "",
  );
  const [pendingExpanded, setPendingExpanded] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();

    if (selectedTypeId) params.set("type", selectedTypeId);
    if (searchText) params.set("search", searchText);
    if (selectedLocationId) params.set("location", selectedLocationId);

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchText, selectedTypeId, selectedLocationId]);
  useEffect(() => {
    router.refresh();
  }, []);
  const [submittedExpanded, setSubmittedExpanded] = useState(false);
  useEffect(() => {
    if (searchText.trim() || selectedTypeId || selectedLocationId) {
      setPendingExpanded(true);
      //setSubmittedExpanded(true);
    }
  }, [searchText, selectedTypeId, selectedLocationId]);
  const filteredEquipment = useMemo(() => {
    const byType = selectedTypeId
      ? equipment.filter((item) => item.equipment_type_id === selectedTypeId)
      : equipment;
    const byLocation = selectedLocationId
      ? byType.filter(
          (item) => item.locations?.site_code === selectedLocationId,
        )
      : byType;

    if (!searchText.trim()) return byLocation;

    const query = searchText.trim().toLowerCase();
    return byLocation.filter((item) => {
      const assetId = getAssetId(item);
      return (
        assetId.toLowerCase().includes(query) ||
        (item.name ?? "").toLowerCase().includes(query)
      );
    });
  }, [equipment, selectedTypeId, searchText, selectedLocationId]);

  const today = new Date().toISOString().slice(0, 10);

  //filtering though the equipments to see whether the
  //submissions table has a entry with the matching equipment id
  const pendingEquipment = filteredEquipment.filter((item) => {
    if (item.next_amc_date)
      return item.next_amc_date <= today || !completedIds.has(item.id);
    return !completedIds.has(item.id);
  });
  const submittedEquipment = filteredEquipment.filter((item) => {
    if (item.next_amc_date)
      return item.next_amc_date > today && completedIds.has(item.id);
    return completedIds.has(item.id);
  });
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
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <TextField
            select
            label="Asset Type"
            value={selectedTypeId}
            fullWidth
            onChange={(e) => {
              setSelectedTypeId(e.target.value);
            }}
          >
            <MenuItem value="">All Types</MenuItem>
            {equipmentTypes.map((type) => (
              <MenuItem key={type.id} value={type.id}>
                {type.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Location"
            value={selectedLocationId}
            fullWidth
            onChange={(e) => {
              setSelectedLocationId(e.target.value);
            }}
          >
            <MenuItem value="">All Locations</MenuItem>
            {locations.map((loc) => (
              <MenuItem key={loc.site_code} value={loc.site_code}>
                {loc.site_code}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
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
      </Box>

      <Accordion
        expanded={pendingExpanded}
        onChange={() => setPendingExpanded((prev) => !prev)}
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography>
            Inspection Pending ({pendingEquipment.length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {renderEquipmentList(pendingEquipment, "Inspect", cancelledDates)}
        </AccordionDetails>
      </Accordion>
      <Accordion
      // expanded={submittedExpanded}
      // onChange={() => setSubmittedExpanded((prev) => !prev)}
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography>
            Inspection Submitted ({submittedEquipment.length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {renderEquipmentList(submittedEquipment, "View", cancelledDates)}
        </AccordionDetails>
      </Accordion>
    </>
  );
}
