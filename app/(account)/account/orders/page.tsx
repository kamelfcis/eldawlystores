import { redirect } from "next/navigation";
import { linkGuestOrdersToAccount } from "@/lib/account/link-orders";
import { getSessionRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { AccountOrders } from "./orders-list";

export const metadata = { title: "طلباتي" };

export default async function OrdersPage() {
  const session = await getSessionRole();
  if (!session?.userId) redirect("/account/login");

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await linkGuestOrdersToAccount(supabase);
  }

  return <AccountOrders userId={session.userId} />;
}
