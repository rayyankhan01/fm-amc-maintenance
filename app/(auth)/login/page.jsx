"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import {
  Button,
  TextField,
  Card,
  CardContent,
  Typography,
  Box,
} from "@mui/material";
import { idID } from "@mui/material/locale";

export default function LoginPage() {
  const router = useRouter();
  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Technicians log in with their employee ID, not an email. Supabase
    // Auth still needs an email-shaped identifier, so accounts are created
    // with a synthetic one derived from emp_id (never actually emailed to).
    const email = `${empId.trim().toLowerCase()}@sevenspikes.internal`;

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.code === "invalid_credentials"
          ? "The employee ID or password is incorrect. Please try again."
          : "Unable to sign in right now. Please try again.");
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("emp_role")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile) {
        setError("Unable to load your account details. Please contact an administrator.");
        setLoading(false);
        return;
      }

      const isAdminSide =
        profile.emp_role === "admin" || profile.emp_role === "manager";

      router.push(isAdminSide ? "/dashboard" : "/inspections");
      router.refresh();
    } catch {
      setError("Unable to sign in right now. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <Box
      component="form"
      onSubmit={handleLogin}
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        gap: 3,
      }}
    >
      <Image
        src="/seven-spikes-group-logo-centered.png"
        alt="Seven Spikes"
        width={1186}
        height={1064}
        style={{ height: 220, width: "auto" }}
        priority
      />
      <Card sx={{ width: 400 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 2 }}>
            FM AMC & Maintenance
          </Typography>
          {error && (
            <Typography color="error" sx={{ mb: 1 }}>
              {error}
            </Typography>
          )}
          <TextField
            label="Employee ID"
            value={empId}
            onChange={(e) => setEmpId(e.target.value)}
            required
            fullWidth
            margin="normal"
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            margin="normal"
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading}
            sx={{ mt: 1 }}
          >
            {loading ? "Signing in..." : "Login"}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
