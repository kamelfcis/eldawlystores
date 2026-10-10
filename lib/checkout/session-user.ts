import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Returns auth.users.id for logged-in checkout, null for guests. */
export async function getCheckoutSessionUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}
