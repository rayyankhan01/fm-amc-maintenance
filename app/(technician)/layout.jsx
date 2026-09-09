import { requireRole } from '@/lib/auth';

export default async function TechnicianLayout({ children }) {
  await requireRole(['technician']);

  return <>{children}</>;
}
