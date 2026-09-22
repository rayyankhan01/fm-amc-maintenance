import { requireRole } from "@/lib/auth";
import LogoutButton from "@/features/auth/components/LogoutButton";

export default async function AdminLayout({ children }) {
  await requireRole(["admin", "manager"]);
  return <>{children}</>;
}
