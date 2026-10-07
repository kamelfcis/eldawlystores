import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database";
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from "./config";
import { isServiceRoleConfigured } from "./service-role";

export async function createClient(): Promise<SupabaseClient<Database>> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }
  const cookieStore = await cookies();
  return createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component — ignore
        }
      },
    },
  }) as unknown as SupabaseClient<Database>;
}

export function createServiceClient() {
  if (!isServiceRoleConfigured()) {
    throw new Error("Supabase service role is not configured");
  }
  return createSupabaseClient<Database>(
    getSupabaseUrl(),
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
