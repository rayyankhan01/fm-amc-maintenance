import { requireRole } from "@/lib/auth";

export default async function AdminLayout({children}){
    await requireRole(['admin','manager']);
    return <>{children}</>
}