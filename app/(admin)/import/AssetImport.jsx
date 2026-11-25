"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import {
  Alert, Box, Button, LinearProgress, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Typography,
} from "@mui/material";
import { importAdminEquipment } from "@/features/admin/commands";
import { IMPORT_COLUMNS, IMPORT_LIMIT } from "@/features/equipment/importValidation";

const DATE_COLUMNS = new Set([8, 10, 11]);

function dateCell(value, date1904) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "Invalid date";
    return `${String(value.getFullYear()).padStart(4, "0")}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  }
  if (typeof value !== "number") return value;
  const date = XLSX.SSF.parse_date_code(value, { date1904 });
  if (!date) return "Invalid date";
  return `${String(date.y).padStart(4, "0")}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
}

export default function AssetImport({ types, statuses, frequencies }) {
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
    const reference = [
      ["Asset Category Code", "Asset Category", "Status Code", "Status", "AMC Frequency Code", "AMC Frequency"],
      ...Array.from({ length: Math.max(types.length, statuses.length, frequencies.length) }, (_, index) => [
        types[index]?.code ?? "", types[index]?.name ?? "", statuses[index]?.code ?? "",
        statuses[index]?.label ?? "", frequencies[index]?.code ?? "", frequencies[index]?.label ?? "",
      ]),
      [],
      ["AMC Date, Refill Date CO2 and Refill Date DCP: YYYY-MM-DD or Excel dates."],
      ["Asset Category: category name. Asset Type: category code. Site: existing site code."],
      ["Capacity/Type: AC only. Refill dates: fire extinguishers only."],
      ["Unit Number is assigned automatically per Asset Type Code. Capacity/Type and refill dates are optional; all other columns are required."],
    ];
    const referenceSheet = XLSX.utils.aoa_to_sheet(reference);
    referenceSheet["!cols"] = Array.from({ length: 6 }, () => ({ wch: 24 }));
    XLSX.utils.book_append_sheet(workbook, referenceSheet, "Reference");
    XLSX.writeFile(workbook, "asset-import-template.xls", { bookType: "biff8" });
  }

  async function handleImport(event) {
    event.preventDefault();
    setError("");
    setResults([]);
    setProgress(0);
    if (!file || !/\.(xls|xlsx)$/i.test(file.name)) {
      setError("Select an .xls or .xlsx file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("The spreadsheet must be 2 MB or smaller.");
      return;
    }
    setBusy(true);
    let completed = 0;
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true, sheetRows: IMPORT_LIMIT + 2 });
      const sheet = workbook.Sheets["Assets"];
      if (!sheet || !sheet["!ref"]) throw new Error("The workbook must contain an Assets sheet from the template.");
      const fullRange = XLSX.utils.decode_range(sheet["!fullref"] || sheet["!ref"]);
      if (fullRange.e.r > IMPORT_LIMIT) throw new Error(`The workbook can contain at most ${IMPORT_LIMIT} asset rows.`);
      if (fullRange.e.c >= IMPORT_COLUMNS.length) throw new Error("Remove columns that are not in the template.");
      const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "", blankrows: true });
      const headers = grid[0] ?? [];
      if (headers.length !== IMPORT_COLUMNS.length || IMPORT_COLUMNS.some((column, index) => String(headers[index] ?? "").trim() !== column)) {
        throw new Error("The Assets sheet headers must match the downloaded template.");
      }
      const rows = [];
      const date1904 = Boolean(workbook.Workbook?.WBProps?.date1904);
      for (let index = 1; index < grid.length; index += 1) {
        const values = Array.from({ length: IMPORT_COLUMNS.length }, (_, column) => grid[index]?.[column] ?? "");
        if (values.every((value) => String(value).trim() === "")) continue;
        for (let column = 0; column < IMPORT_COLUMNS.length; column += 1) {
          if (sheet[XLSX.utils.encode_cell({ r: index, c: column })]?.f) throw new Error(`Row ${index + 1} contains a formula. Use plain values instead.`);
          if (DATE_COLUMNS.has(column)) values[column] = dateCell(values[column], date1904);
        }
        rows.push({ rowNumber: index + 1, values });
      }
      if (!rows.length) throw new Error("The spreadsheet does not contain any asset rows.");
      for (let index = 0; index < rows.length; index += 10) {
        const batch = await importAdminEquipment(rows.slice(index, index + 10));
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