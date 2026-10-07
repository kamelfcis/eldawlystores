"use server";

import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function logout() {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch {
      // Cookie writes can fail outside a mutable request. Still leave the account area.
    }
  }

  redirect("/account/login");
}

/** @deprecated Use logout — kept for plan/checklist naming */
export const signOut = logout;
