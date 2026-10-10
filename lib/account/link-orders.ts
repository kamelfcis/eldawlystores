import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/**
 * Links prior guest orders (user_id IS NULL) to the signed-in account when
 * customer_email matches auth.email() exactly (case-insensitive).
 * Called once from the account orders page on load — not a migration — so
 * existing production orders are relinked on first visit without a deploy-time backfill.
 */
export async function linkGuestOrdersToAccount(
  supabase: SupabaseClient<Database>
): Promise<number> {
  const { data, error } = await supabase.rpc("link_guest_orders_to_user");
  if (error) return 0;
  return typeof data === "number" ? data : 0;
}
