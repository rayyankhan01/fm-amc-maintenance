"use client";

import { useState } from "react";
import {
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
} from "@mui/material";

export default function AdminList({ columns, rows, filters = [], searchLabel = "Search" }) {
  const [search, setSearch] = useState("");
  const [selectedFilters, setSelectedFilters] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const query = search.trim().toLowerCase();
  const filteredRows = rows.filter((row) =>
    (!query || row.searchText.toLowerCase().includes(query)) &&
    filters.every(({ key }) => !selectedFilters[key] || selectedFilters[key] === "__all__" || row.filters?.[key] === selectedFilters[key]),
  );
  const currentPage = Math.min(page, Math.max(0, Math.ceil(filteredRows.length / rowsPerPage) - 1));

  return (
    <>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          label={searchLabel}
          value={search}
          onChange={(event) => { setSearch(event.target.value); setPage(0); }}
          size="small"
        />
        {filters.map(({ key, label }) => {
          const options = [...new Set(rows.map((row) => row.filters?.[key]).filter(Boolean))].sort();
          return (
            <TextField
              key={key}
              select
              label={label}
              value={selectedFilters[key] ?? "__all__"}
              onChange={(event) => {
                setSelectedFilters((current) => ({ ...current, [key]: event.target.value }));
                setPage(0);
              }}
              size="small"
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="__all__">All</MenuItem>
              {options.map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
            </TextField>
          );
        })}
      </Stack>
      <Paper variant="outlined" sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead><TableRow>{columns.map((column) => <TableCell key={column}>{column}</TableCell>)}</TableRow></TableHead>
          <TableBody>
            {filteredRows.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage).map((row) => row.content)}
            {filteredRows.length === 0 && <TableRow><TableCell colSpan={columns.length}>No records found.</TableCell></TableRow>}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredRows.length}
          page={currentPage}
          onPageChange={(_, nextPage) => setPage(nextPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(0); }}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Paper>
    </>
  );
}