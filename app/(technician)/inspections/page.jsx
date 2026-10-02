import LogoutButton from "@/features/auth/components/LogoutButton";
import { Container, Grid, Paper, Typography } from "@mui/material";
import Link from "next/link";

export default function InspectionsHomePage() {
  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ mb: 4, textAlign: "center" }}>
        Select Inspection Type
      </Typography>
      <Grid container spacing={2}>
        <Grid size={6}>
          <Link
            href="/inspections/amc"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
              AMC
            </Paper>
          </Link>
        </Grid>
        <Grid size={6}>
          <Link
            href="/inspections/maintenance"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
              Maintenance
            </Paper>
          </Link>
        </Grid>
        <Grid size={12} sx={{ mt: 4, textAlign: "center" }}>
          <LogoutButton />
        </Grid>
      </Grid>
    </Container>
  );
}
