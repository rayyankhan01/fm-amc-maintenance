import { Container, Grid, Paper, Stack, Typography } from "@mui/material";
import LogoutButton from "@/features/auth/components/LogoutButton";
const sections = [
  {
    href: "/users",
    title: "Users",
    description: "Manage staff accounts, roles, and access.",
  },
  {
    href: "/equipment",
    title: "Equipment",
    description: "Manage assets and equipment categories.",
  },
  {
    href: "/locations",
    title: "Locations",
    description: "Manage sites, rooms, and areas.",
  },
  {
    href: "/equipment-types",
    title: "Device types",
    description: "Manage equipment categories and codes.",
  },
  {
    href: "/templates",
    title: "Inspection templates",
    description: "Configure fields used by inspections.",
  },
  {
    href: "/configuration",
    title: "Configuration",
    description: "Manage statuses, frequencies, and settings.",
  },
  {
    href: "/reports",
    title: "Reports",
    description: "Review and export inspection data.",
  },
];

export default function AdminDashboardPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 4,
        }}
      >
        <Stack spacing={1}>
          <Typography variant="h4">Administrator</Typography>
          <Typography color="text.secondary">
            Configure the maintenance system and manage access.
          </Typography>
        </Stack>
        <LogoutButton />
      </Stack>
      <Grid container spacing={2}>
        {sections.map((section) => (
          <Grid key={section.href} size={{ xs: 12, sm: 6, md: 4 }}>
            <Paper
              component="a"
              href={section.href}
              variant="outlined"
              sx={{
                display: "block",
                p: 3,
                height: "100%",
                textDecoration: "none",
                color: "inherit",
                "&:hover": { borderColor: "primary.main" },
              }}
            >
              <Typography variant="h6" sx={{ mb: 1 }}>
                {section.title}
              </Typography>
              <Typography color="text.secondary">
                {section.description}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
