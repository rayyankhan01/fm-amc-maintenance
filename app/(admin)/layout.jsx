import { requireRole } from "@/lib/auth";
import LogoutButton from "@/features/auth/components/LogoutButton";
import AdminBreadcrumbs from './AdminBreadcrumbs';

export default async function AdminLayout({ children }) {
  await requireRole(["admin", "manager"]);
  return (
    <>
      <AdminBreadcrumbs />
      {children}
    </>
  );
}
