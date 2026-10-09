import { signOut } from "../auth";
import { Button } from "@mui/material";
export default function LogoutButton() {
  return (
    <form action={signOut} style={{ textAlign: "center" }}>
      <Button type="submit" variant="contained" size="small" color="error">
        Log Out
      </Button>
    </form>
  );
}
