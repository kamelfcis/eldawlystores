import { getSessionRole } from "@/lib/auth";
import { AccountOrders } from "./orders-list";

export const metadata = { title: "طلباتي" };

export default async function OrdersPage() {
  const session = await getSessionRole();
  return <AccountOrders userId={session?.userId ?? null} />;
}
