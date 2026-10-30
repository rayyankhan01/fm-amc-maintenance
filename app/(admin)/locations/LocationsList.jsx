"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  TableCell,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { deleteLocation } from "@/features/admin/commands";
import AdminList from "../AdminList";

export default function LocationsList({ locations }) {
  const router = useRouter();
  const [selectedSiteCode, setSelectedSiteCode] = useState("");
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const sites = useMemo(() => {
    const uniqueSites = new Map();
    for (const location of locations) {
      if (!uniqueSites.has(location.site_code)) {
        uniqueSites.set(location.site_code, location);
      }
    }
    return Array.from(uniqueSites.values());
  }, [locations]);

  const filteredLocations = useMemo(
    () =>
      locations.filter((location) => location.site_code === selectedSiteCode),
    [locations, selectedSiteCode],
  );

  async function handleConfirmDelete() {
    setDeleting(true);
    try {
      await deleteLocation(confirmTarget.id);
      setConfirmTarget(null);
      router.refresh();
    } catch (error) {
      setDeleteError(error.message ?? "Failed to delete location.");
      setConfirmTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <TextField
          select
          label="Site"
          value={selectedSiteCode}
          onChange={(e) => setSelectedSiteCode(e.target.value)}
          fullWidth
        >
          <MenuItem value="">Select a site</MenuItem>
          {sites.map((site) => (
            <MenuItem key={site.site_code} value={site.site_code}>
              {site.site_name
                ? `${site.site_code} - ${site.site_name}`
                : site.site_code}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {!selectedSiteCode ? (
        <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
          Select a site to view its rooms.
        </Typography>
      ) : (
        <AdminList
          key={selectedSiteCode}
          columns={["Site", "Name", "Room/area", "Actions"]}
          searchLabel="Search locations"
          rows={filteredLocations.map((location) => ({
            id: location.id,
            searchText: [location.site_code, location.site_name, location.room_area].filter(Boolean).join(" "),
            content: <TableRow key={location.id}>
                  <TableCell>{location.site_code}</TableCell>
                  <TableCell>{location.site_name ?? "-"}</TableCell>
                  <TableCell>{location.room_area}</TableCell>
                  <TableCell>
                    <Button href={`/locations/${location.id}`}>Edit</Button>
                    <Button
                      color="error"
                      onClick={() => setConfirmTarget(location)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>,
          }))}
        />
      )}

      <Dialog
        open={Boolean(confirmTarget)}
        onClose={() => setConfirmTarget(null)}
      >
        <DialogTitle>Delete location?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete this location. Assets or movement
            history may prevent deletion.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmTarget(null)}>Cancel</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleting}
            autoFocus
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteError)} onClose={() => setDeleteError(null)}>
        <DialogTitle>Can&apos;t delete this location</DialogTitle>
        <DialogContent>
          <DialogContentText>{deleteError}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteError(null)} autoFocus>
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
