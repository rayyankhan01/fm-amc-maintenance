import { redirect } from "next/navigation";
import {
  Container,
  Typography,
  Paper,
  Stack,
  Divider,
  Button,
} from "@mui/material";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import ResolveForm from "./ResolveForm";
import Link from "next/link";

export default async function MaintenanceIssuePage({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: issues, error } = await supabase
    .from("maintenance_issues")
    .select(
      `
      id, status, opened_at,
      equipment ( id, name, equipment_type, equipment_type_code, unit_number, locations ( site_code, room_area ) ),
      form_responses ( remarks, result, form_fields ( label ), form_submissions ( inspection_date ) )
    `,
    )
    .eq("equipment_id", id)
    .eq("status", "open")
    .order("opened_at", { ascending: false });

  if (error) throw error;
  if (!issues || issues.length === 0) redirect("/inspections/maintenance");

  const equipment = issues[0].equipment;
  const assetId = `${equipment.locations?.site_code ?? "?"}/${equipment.equipment_type_code}/${equipment.unit_number}`;

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ justifyContent: "space-between", mb: 3 }}
      >
        <Stack direction="column" spacing={0.5} sx={{ mb: 1 }}>
          <Typography variant="h5" sx={{ mb: 1 }}>
            {equipment.name ?? equipment.equipment_type}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {assetId}
          </Typography>
        </Stack>

        <Link
          href="/inspections/maintenance"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <Button variant="outlined" sx={{ mb: 3 }}>
            Back to Maintenance Inspections
          </Button>
        </Link>
      </Stack>

      <Stack spacing={3}>
        {issues.map((issue) => {
          const response = issue.form_responses;
          return (
            <Paper key={issue.id} variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={1} sx={{ mb: 2 }}>
                <Typography>
                  <strong>Checklist item:</strong>{" "}
                  {response?.form_fields?.label ?? "Unknown item"}
                </Typography>
                <Typography>
                  <strong>Remarks:</strong> {response?.remarks || "-"}
                </Typography>
                <Typography>
                  <strong>Found on:</strong>{" "}
                  {response?.form_submissions?.inspection_date ?? "-"}
                </Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <ResolveForm issueId={issue.id} technicianId={profile.id} />
            </Paper>
          );
        })}
      </Stack>
    </Container>
  );
}
