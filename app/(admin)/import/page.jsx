import { Container, Stack, Typography } from "@mui/material";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import AssetImport from "./AssetImport";

export default async function ImportPage() {
  await requireRole(["admin"]);
  const supabase = createAdminClient();
  const [types, statuses, frequencies] = await Promise.all([
    supabase.from("equipment_types").select("code, name").eq("is_active", true).order("name"),
    supabase.from("status_values").select("code, label").eq("is_active", true).order("label"),
    supabase.from("maintenance_frequencies").select("code, label").eq("is_active", true).order("label"),
  ]);
  const error = [types, statuses, frequencies].find((result) => result.error)?.error;
  if (error) throw error;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Typography variant="h4">Import assets</Typography>
        <AssetImport types={types.data} statuses={statuses.data} frequencies={frequencies.data} />
      </Stack>
    </Container>
  );
}