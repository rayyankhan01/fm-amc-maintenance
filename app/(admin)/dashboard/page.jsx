import { Container, Grid, Paper, Stack, Typography, Box } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { createClient } from "@/lib/supabase/server";
import { getInspectionAlerts } from "@/features/alerts/api";
import LogoutButton from "@/features/auth/components/LogoutButton";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import theme from "@/app/theme";

const badgeBg = alpha(theme.palette.secondary.main, 0.12);
const badgeBgHover = alpha(theme.palette.secondary.main, 0.2);
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { getCurrentProfile } from "@/lib/auth";
const sections = [
  {
    href: "/users",
    title: "Users",
    description: "Manage staff accounts, roles, and access.",
    icon: PeopleOutlinedIcon,
  },
  {
    href: "/equipment",
    title: "Assets",
    description: "Manage assets and asset categories.",
    icon: Inventory2OutlinedIcon,
  },
  {
    href: "/locations",
    title: "Locations",
    description: "Manage sites, rooms, and areas.",
    icon: LocationOnOutlinedIcon,
  },
  {
    href: "/equipment-types",
    title: "Asset types",
    description: "Manage asset categories and codes.",
    icon: CategoryOutlinedIcon,
  },
  {
    href: "/templates",
    title: "Inspection templates",
    description: "Configure fields used by inspections.",
    icon: AssignmentOutlinedIcon,
  },
  {
    href: "/configuration",
    title: "Configuration",
    description: "Manage statuses, frequencies, and settings.",
    icon: SettingsOutlinedIcon,
  },
  {
    href: "/reports",
    title: "Reports",
    description: "Review and export inspection data.",
    icon: AssessmentOutlinedIcon,
  },
];

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const [{ due, overdue, newAssets, cancelledAlerts }, profile] = await Promise.all([
    getInspectionAlerts(supabase),
    getCurrentProfile(),
  ]);
  const dashboardSections = [
    ...sections,
    ...(profile?.emp_role === "admin" ? [{
      href: "/import",
      title: "Import",
      description: "Import assets from a spreadsheet.",
      icon: UploadFileOutlinedIcon,
    }] : []),
    {
      href: "/alerts",
      title: "Alerts and notifications",
      description: `${due.length} due, ${overdue.length} overdue, ${newAssets.length} new asset${newAssets.length === 1 ? "" : "s"}.\n${cancelledAlerts.length} cancelled inspection${cancelledAlerts.length === 1 ? "" : "s"}.`,
      icon: NotificationsActiveOutlinedIcon,
    },
  ];

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
        {dashboardSections.map((section) => (
          <Grid key={section.href} size={{ xs: 12, sm: 6, md: 4 }}>
            <Paper
              component="a"
              href={section.href}
              variant="outlined"
              sx={{
                display: "block",
                position: "relative",
                p: 3,
                height: "100%",
                textDecoration: "none",
                color: "inherit",
                transition:
                  "box-shadow 0.15s ease, border-color 0.15s ease, transform 0.15s ease",
                "&:hover": {
                  borderColor: "primary.main",
                  boxShadow: 2,
                  transform: "translateY(-2px)",
                },
                "&:hover .card-badge": {
                  bgcolor: badgeBgHover,
                },
                "&:hover .card-arrow": {
                  opacity: 1,
                  transform: "translateX(0)",
                },
              }}
            >
              <Box
                className="card-badge"
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 1.5,
                  bgcolor: badgeBg,
                  transition: "background-color 0.15s ease",
                }}
              >
                <section.icon sx={{ color: "secondary.main", fontSize: 22 }} />
              </Box>
              <Typography variant="h6" sx={{ lineHeight: 1, mb: 1 }}>
                {section.title}
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ whiteSpace: "pre-line" }}
              >
                {section.description}
              </Typography>
              <ArrowForwardIcon
                className="card-arrow"
                sx={{
                  position: "absolute",
                  bottom: 16,
                  right: 16,
                  fontSize: 18,
                  color: "secondary.main",
                  opacity: 0,
                  transform: "translateX(-4px)",
                  transition: "opacity 0.15s ease, transform 0.15s ease",
                }}
              />
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
