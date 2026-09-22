import LogoutButton from "@/features/auth/components/LogoutButton";
import { requireRole } from "@/lib/auth";

export default async function TechnicianLayout({ children }) {
  await requireRole(["technician"]);

  return <>{children}</>;
}
