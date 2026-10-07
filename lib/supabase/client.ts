"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from "./config";

export function createClient(): SupabaseClient<Database> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }
  return createBrowserClient<Database>(getSupabaseUrl(), getSupabaseAnonKey()) as unknown as SupabaseClient<Database>;
}
