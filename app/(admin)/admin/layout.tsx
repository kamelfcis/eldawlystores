import { getAccountMenu } from "@/lib/auth";
import { assertAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await assertAdmin();
  const account = await getAccountMenu();
  const name = account?.name || account?.email || "مدير";

  return <AdminShell name={name}>{children}</AdminShell>;
}
