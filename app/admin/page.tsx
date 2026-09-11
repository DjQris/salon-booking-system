import { AdminDashboard } from "@/components/AdminDashboard";
import { requireAdmin } from "@/lib/auth";

export default async function AdminPage() {
  await requireAdmin();
  return <AdminDashboard />;
}
