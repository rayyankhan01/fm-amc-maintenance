"use client";

import { useEffect } from "react";
import { Alert, Button, Container, Stack } from "@mui/material";

export default function AppError({ error, retry }) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={2}>
        <Alert severity="error">Something went wrong. Please try again. If the problem continues, contact an administrator.</Alert>
        <Button variant="contained" onClick={retry} sx={{ alignSelf: "flex-start" }}>Try again</Button>
      </Stack>
    </Container>
  );
}