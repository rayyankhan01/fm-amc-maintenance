import { Stack } from "@mui/material";
import { Box, Typography } from "@mui/material";
import LogoutButton from "@/features/auth/components/LogoutButton";

export default function UnauthorizedPage() {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      }}
    >
      <Stack spacing={2} alignitems="center">
        <Typography color="text.secondary">
          Your account does not have access to this page.
        </Typography>
        <LogoutButton />
      </Stack>
    </Box>
  );
}
