import {
  Alert,
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

function responseText(field, response) {
  if (!response) return "-";
  if (field.field_type === "checklist_item") {
    const resultLabels = { OK: "OK", N_OK: "Not OK", N_A: "N/A" };
    return resultLabels[response.result] ?? response.result ?? "-";
  }
  return response.value || "-";
}

function resultColor(result) {
  if (result === "OK") return "success";
  if (result === "N_OK") return "error";
  if (result === "N_A") return "default";
  return "default";
}

/**
 * Read-only renderer for a submitted form. The template controls the fields,
 * so AC inspection reports do not need a separate hard-coded component.
 */
export default function SubmissionViewer({ submission }) {
  const responseByField = new Map(
    (submission.form_responses ?? []).map((response) => [
      response.field_id,
      response,
    ]),
  );
  const fields = submission.form_templates?.form_fields ?? [];
  const headerFields = fields.filter(
    (field) =>
      field.field_type !== "checklist_item" && field.field_type !== "image",
  );
  const sectionableFields = fields.filter(
    (field) =>
      field.field_type === "checklist_item" || field.field_type === "image",
  );
  const sections = [];

  for (const field of sectionableFields) {
    const section = field.section?.trim() || "Inspection checklist";
    const previous = sections[sections.length - 1];
    if (previous?.name === section) previous.fields.push(field);
    else sections.push({ name: section, fields: [field] });
  }

  const equipment = submission.equipment ?? {};
  const location = equipment.locations ?? {};
  const technician = submission.profiles?.name ?? "-";
  const assetId = equipment.id
    ? (equipment.asset_id ??
      `${location.site_code ?? "?"}/${equipment.equipment_type_code ?? "?"}/${equipment.unit_number ?? "?"}`)
    : "-";

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">
          {submission.form_templates?.name ?? "Inspection report"}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Submitted{" "}
          {submission.submitted_at
            ? new Date(submission.submitted_at).toLocaleString()
            : "-"}
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Inspection details
        </Typography>
        <Stack spacing={1}>
          <Typography>
            <strong>Asset ID:</strong> {assetId}
          </Typography>
          <Typography>
            <strong>Asset:</strong>{" "}
            {equipment.name || equipment.equipment_type || "-"}
          </Typography>
          <Typography>
            <strong>Location:</strong>{" "}
            {location.site_name || location.site_code || "-"}
            {location.room_area ? `, ${location.room_area}` : ""}
          </Typography>
          <Typography>
            <strong>Inspection date:</strong> {submission.inspection_date}
          </Typography>
          <Typography>
            <strong>Technician:</strong> {technician}
          </Typography>
        </Stack>
      </Paper>

      {headerFields.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Inspection information
          </Typography>
          <Stack spacing={1}>
            {headerFields.map((field) => {
              const response = responseByField.get(field.id);

              // Dead code: headerFields no longer contains "image" fields (see sections
              // useMemo above), so this branch can't execute. Kept in case that changes.s
              if (field.field_type === "image") {
                return (
                  <Box key={field.id}>
                    <Typography>
                      <strong>{field.label}:</strong>
                    </Typography>
                    {response?.value ? (
                      <a
                        href={response.value}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Box
                          component="img"
                          src={response.value}
                          alt={field.label}
                          sx={{
                            maxWidth: 200,
                            maxHeight: 200,
                            display: "block",
                            mt: 1,
                          }}
                        />
                      </a>
                    ) : (
                      <Typography color="text.secondary">-</Typography>
                    )}
                  </Box>
                );
              }
              return (
                <Typography key={field.id}>
                  <strong>{field.label}:</strong>{" "}
                  {responseText(field, response)}
                </Typography>
              );
            })}
          </Stack>
        </Paper>
      )}

      {sections.map((section, index) => {
        const isImageOnlySection = section.fields.every(
          (field) => field.field_type === "image",
        );
        return (
          <Paper
            variant="outlined"
            sx={{ overflow: "hidden" }}
            key={`${section.name}-${index}`}
          >
            <Typography variant="h6" sx={{ p: 2 }}>
              {section.name}
            </Typography>
            <Divider />
            <Table size="small">
              {!isImageOnlySection && (
                <TableHead>
                  <TableRow>
                    <TableCell>Inspection item</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Remarks</TableCell>
                  </TableRow>
                </TableHead>
              )}

              <TableBody>
                {section.fields.map((field) => {
                  const response = responseByField.get(field.id);
                  if (field.field_type === "image") {
                    return (
                      <TableRow key={field.id}>
                        <TableCell colSpan={3}>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>{field.label}</strong>
                          </Typography>
                          {response?.value ? (
                            <a
                              href={response.value}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Box
                                component="img"
                                src={response.value}
                                alt={field.label}
                                sx={{
                                  maxWidth: 200,
                                  maxHeight: 200,
                                  display: "block",
                                }}
                              />
                            </a>
                          ) : (
                            <Typography color="text.secondary">-</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  }
                  return (
                    <TableRow key={field.id}>
                      <TableCell>{field.label}</TableCell>
                      <TableCell>
                        <Chip
                          label={responseText(field, response)}
                          color={resultColor(response?.result)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{response?.remarks || "-"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Paper>
        );
      })}

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Signatures
        </Typography>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={4}
          sx={{ justifyContent: "space-between" }}
        >
          {submission.technician_signature ? (
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Technician
              </Typography>
              <Box
                component="img"
                src={submission.technician_signature}
                alt="Technician signature"
                sx={{
                  display: "block",
                  maxWidth: "100%",
                  height: 100,
                  objectFit: "contain",
                  objectPosition: "left",
                }}
              />
            </Box>
          ) : (
            <Alert severity="info" sx={{ flex: 1 }}>
              No technician signature recorded.
            </Alert>
          )}
          {submission.supervisor_signature && (
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Supervisor
              </Typography>
              <Box
                component="img"
                src={submission.supervisor_signature}
                alt="Supervisor signature"
                sx={{
                  display: "block",
                  maxWidth: "100%",
                  height: 100,
                  objectFit: "contain",
                  objectPosition: "left",
                }}
              />
            </Box>
          )}
          <Box
            className="manager-signature-slot"
            sx={{
              flex: 1,
              minWidth: 220,
              minHeight: 130,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                borderBottom: "1px solid",
                borderColor: "text.primary",
                height: 80,
                width: "100%",
              }}
            />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Manager&apos;s wet signature
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Signature / date
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Stack>
  );
}
