import { redirect } from "next/navigation";
import { getSessionRole } from "@/lib/auth";
import { AccountOrders } from "./orders-list";

export const metadata = { title: "طلباتي" };

export default async function OrdersPage() {
  const session = await getSessionRole();
  if (!session?.userId) redirect("/account/login");
  return <AccountOrders userId={session.userId} />;
}
