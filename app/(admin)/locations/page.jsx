import { createClient } from "@/lib/supabase/server";
import { Container, Button, Stack, Typography } from "@mui/material";
import LocationsList from "./LocationsList";

export default async function LocationsPage() {
  const supabase = await createClient();
  const { data: locations, error } = await supabase
    .from("locations")
    .select("id, site_code, site_name, room_area")
    .order("site_code")
    .order("room_area");
  if (error) throw error;
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" sx={{ mb: 3, justifyContent: "space-between" }}>
        <Typography variant="h4">Locations</Typography>
        <Button href="/locations/new" variant="contained">
          Add location
        </Button>
      </Stack>
      <LocationsList locations={locations} />
    </Container>
  );
}
