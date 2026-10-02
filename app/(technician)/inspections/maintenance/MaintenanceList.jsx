"use client";
import {
  List,
  ListItemButton,
  ListItemText,
  Chip,
  Paper,
  TextField,
  Box,
  Stack,
  MenuItem,
} from "@mui/material";
import Link from "next/link";
import { Typography } from "@mui/material";
import { useState, useMemo } from "react";
function getAssetId(equipment) {
  return `${equipment.locations?.site_code ?? "?"}/${equipment.equipment_type_code}/${equipment.unit_number}`;
}
export default function MaintenanceList({ groups }) {
  const [searchText, setSearchText] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");

  const siteOptions = useMemo(() => {
    const uniqueSites = new Set();
    for (const { equipment } of groups) {
      if (equipment.locations?.site_code) {
        uniqueSites.add(equipment.locations.site_code);
      }
    }
    return Array.from(uniqueSites).sort();
  }, [groups]);

  const filteredGroups = useMemo(() => {
    const byLocation = selectedLocationId
      ? groups.filter(
          ({ equipment }) =>
            equipment.locations?.site_code === selectedLocationId,
        )
      : groups;

    if (!searchText.trim()) return byLocation;

    const query = searchText.trim().toLowerCase();
    return byLocation.filter(({ equipment }) => {
      const assetId = getAssetId(equipment);
      return (
        assetId.toLowerCase().includes(query) ||
        (equipment.name ?? "").toLowerCase().includes(query) ||
        (equipment.equipment_type ?? "").toLowerCase().includes(query)
      );
    });
  }, [searchText, selectedLocationId, groups]);

  if (groups.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
        No maintenance issues found.
      </Typography>
    );
  }
  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" spacing={2}>
          <TextField
            label="Search Asset"
            fullWidth
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <TextField
            label="Search Location"
            select
            fullWidth
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
          >
            <MenuItem value="">All Locations</MenuItem>
            {siteOptions.map((site) => (
              <MenuItem key={site} value={site}>
                {site}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Box>

      {filteredGroups.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
          No matching equipment found.
        </Typography>
      ) : (
        <Paper variant="outlined">
          <List disablePadding>
            {filteredGroups.map(({ equipment, issues }) => {
              const assetId = getAssetId(equipment);
              return (
                <Link
                  key={equipment.id}
                  href={`/inspections/maintenance/${equipment.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <ListItemButton divider>
                    <ListItemText
                      primary={equipment.name ?? equipment.equipment_type}
                      secondary={`${assetId}· ${equipment.locations?.room_area ? `Room ${equipment.locations.room_area}` : ""}`}
                    />
                    <Chip
                      label={`${issues.length} open`}
                      size="small"
                      color="error"
                    />
                  </ListItemButton>
                </Link>
              );
            })}
          </List>
        </Paper>
      )}
    </>
  );
}
