import { signOut } from "../auth";
import { Button } from "@mui/material";
export default function LogoutButton() {
  return (
    <form action={signOut} style={{ textAlign: "center" }}>
      <Button type="submit" variant="contained">
        Log Out
      </Button>
    </form>
  );
}
