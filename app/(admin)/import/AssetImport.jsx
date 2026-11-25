"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import {
  Alert, Box, Button, LinearProgress, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Typography,
} from "@mui/material";
import { importAdminEquipment, startAdminEquipmentImport } from "@/features/admin/commands";
import { IMPORT_COLUMNS, IMPORT_LIMIT } from "@/features/equipment/importValidation";

const DATE_COLUMNS = new Set([8, 10, 11]);

function dateCell(value, date1904) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "Invalid date";
    return `${String(value.getFullYear()).padStart(4, "0")}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  }
  if (typeof value !== "number") return value;
  const date = XLSX.SSF.parse_date_code(value, { date1904 });
  if (!date) return String(value);
  return `${String(date.y).padStart(4, "0")}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
}

export default function AssetImport() {
  const [file, setFile] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  function downloadTemplate() {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([IMPORT_COLUMNS]);
    sheet["!cols"] = IMPORT_COLUMNS.map((column) => ({ wch: Math.max(column.length + 3, 18) }));
    XLSX.utils.book_append_sheet(workbook, sheet, "Assets");
    XLSX.writeFile(workbook, "asset-import-template.xls", { bookType: "biff8" });
  }

  async function handleImport(event) {
    event.preventDefault();
    setError("");
    setResults([]);
    setProgress(0);
    if (!file || !/\.(xls|xlsx)$/i.test(file.name)) {
      setError(`Spreadsheet [${file?.name ?? "none"}]: Select an .xls or .xlsx file.`);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError(`Spreadsheet [${file.name}] must be 2 MB or smaller.`);
      return;
    }
    setBusy(true);
    let completed = 0;
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true, sheetRows: IMPORT_LIMIT + 2 });
      const sheet = workbook.Sheets["Assets"];
      if (!sheet || !sheet["!ref"]) throw new Error(`Spreadsheet [${file.name}] must contain an Assets sheet from the template.`);
      const fullRange = XLSX.utils.decode_range(sheet["!fullref"] || sheet["!ref"]);
      if (fullRange.e.r > IMPORT_LIMIT) throw new Error(`Spreadsheet [${file.name}] contains ${fullRange.e.r} asset rows; the maximum is ${IMPORT_LIMIT}.`);
      if (fullRange.e.c >= IMPORT_COLUMNS.length) throw new Error(`Spreadsheet [${file.name}] contains extra columns. Remove columns that are not in the template.`);
      const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "", blankrows: true });
      const headers = grid[0] ?? [];
      const mismatchedHeader = IMPORT_COLUMNS.findIndex((column, index) => String(headers[index] ?? "").trim() !== column);
      if (mismatchedHeader !== -1) {
        throw new Error(`Column header [${String(headers[mismatchedHeader] ?? "").trim() || "empty"}] must be [${IMPORT_COLUMNS[mismatchedHeader]}].`);
      }
      if (headers.length !== IMPORT_COLUMNS.length) {
        throw new Error(`Spreadsheet [${file.name}] headers must match the downloaded template.`);
      }
      const rows = [];
      const date1904 = Boolean(workbook.Workbook?.WBProps?.date1904);
      for (let index = 1; index < grid.length; index += 1) {
        const values = Array.from({ length: IMPORT_COLUMNS.length }, (_, column) => grid[index]?.[column] ?? "");
        if (values.every((value) => String(value).trim() === "")) continue;
        for (let column = 0; column < IMPORT_COLUMNS.length; column += 1) {
          const formula = sheet[XLSX.utils.encode_cell({ r: index, c: column })]?.f;
          if (formula) throw new Error(`Row ${index + 1}, ${IMPORT_COLUMNS[column]} [=${formula}] contains a formula. Use plain values instead.`);
          if (DATE_COLUMNS.has(column)) values[column] = dateCell(values[column], date1904);
        }
        rows.push({ rowNumber: index + 1, values });
      }
      if (!rows.length) throw new Error(`Spreadsheet [${file.name}] does not contain any asset rows.`);
      const importBatchNo = await startAdminEquipmentImport();
      for (let index = 0; index < rows.length; index += 10) {
        const batch = await importAdminEquipment(rows.slice(index, index + 10), importBatchNo);
        completed += batch.length;
        setResults((current) => [...current, ...batch]);
        setProgress(Math.round((completed / rows.length) * 100));
      }
    } catch (importError) {
      setError(completed ? `Import stopped after ${completed} rows. Check the results before retrying.` : (importError.message || "Unable to read the spreadsheet."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Stack spacing={3}>
            <Box>
        <Alert severity="warning" sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>Excel Import Guidelines</Typography>
        <Typography variant="body2">Please follow these guidelines before uploading the Excel file:</Typography>
        <Box component="ul" sx={{ pl: 3, mb: 0 }}>
          <Typography component="li" variant="body2">Download the Excel template and enter the asset details in the respective columns.</Typography>
          <Typography component="li" variant="body2">All columns are mandatory except Capacity/Type, Refill Date CO2, and Refill Date DCP.</Typography>
          <Typography component="li" variant="body2">Enter dates in YYYY-MM-DD format.</Typography>
          <Typography component="li" variant="body2">Asset Category, Asset Type Code, Site Code and Asset Type must already be available in the application.</Typography>
          <Typography component="li" variant="body2">Do not change the Excel column headers or template format.</Typography>
          <Typography component="li" variant="body2">Ensure all mandatory fields are completed before uploading.</Typography>
          <Typography component="li" variant="body2">Once completed, click Choose Spreadsheet to select the Excel file, then click Import Assets to upload.</Typography>
        </Box>
        </Alert>
        <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Sample spreadsheet</Typography>
        <Box sx={{ overflowX: "auto" }}>
          <Box
            component="img"
            src="/AssetImport.png"
            alt="Example asset import spreadsheet with three sample rows"
            sx={{ display: "block", width: 1870, maxWidth: "none", height: "auto" }}
          />
        </Box>
      </Box>
      <Box>
        <Button variant="outlined" startIcon={<DownloadOutlinedIcon />} onClick={downloadTemplate} disabled={busy}>
          Download template
        </Button>
      </Box>
      <Stack component="form" onSubmit={handleImport} spacing={2} sx={{ alignItems: "flex-start" }}>
        <Button component="label" variant="outlined" startIcon={<UploadFileOutlinedIcon />} disabled={busy}>
          Choose spreadsheet
          <input type="file" accept=".xls,.xlsx" hidden onChange={(event) => { setFile(event.target.files?.[0] ?? null); setError(""); setResults([]); }} />
        </Button>
        <Typography variant="body2" color="text.secondary">{file?.name ?? "No spreadsheet selected"}</Typography>
        <Button type="submit" variant="contained" disabled={!file || busy}>Import assets</Button>
      </Stack>
      {busy && <LinearProgress variant={progress ? "determinate" : "indeterminate"} value={progress} aria-label="Import progress" />}
      {error && <Alert severity="error">{error}</Alert>}
      {results.length > 0 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 1 }}>Import results</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {results.filter((result) => result.status === "Imported").length} imported, {results.filter((result) => result.status === "Skipped").length} skipped, {results.filter((result) => result.status === "Rejected").length} rejected
          </Typography>
          <TableContainer>
            <Table size="small" aria-label="Asset import results">
              <TableHead><TableRow><TableCell>Row</TableCell><TableCell>Status</TableCell><TableCell>Details</TableCell></TableRow></TableHead>
              <TableBody>{results.map((result) => <TableRow key={result.row}><TableCell>{result.row}</TableCell><TableCell>{result.status}</TableCell><TableCell>{result.message}</TableCell></TableRow>)}</TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Stack>
  );
}