import { Container, Stack, Typography } from "@mui/material";
import { requireRole } from "@/lib/auth";
import AssetImport from "./AssetImport";

export default async function ImportPage() {
  await requireRole(["admin"]);
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Typography variant="h4">Import assets</Typography>
        <AssetImport />
      </Stack>
    </Container>
  );
}