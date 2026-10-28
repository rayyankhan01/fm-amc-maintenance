"use client";
import { useRouter } from "next/navigation";
import { Button } from "@mui/material";

export default function BackButton() {
  const router = useRouter();

  return (
    <Button onClick={() => router.back()} sx={{ mb: 2 }}>
      Back
    </Button>
  );
}
