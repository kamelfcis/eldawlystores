import { isSupabaseConfigured } from "./config";

export function isServiceRoleConfigured(): boolean {
  return Boolean(isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
