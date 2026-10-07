import { createClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database, Json } from "@/lib/types/database";

export function normalizeEgyptianMobile(raw: string): string | null {
  let digits = raw.replace(/[^\d]/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("20") && digits.length === 12) digits = `0${digits.slice(2)}`;
  if (!/^01[0125]\d{8}$/.test(digits)) return null;
  return digits;
}

export function readWhatsappValue(value: Json | null | undefined): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, Json | undefined>;
    for (const key of ["number", "phone", "value", "whatsapp"]) {
      const entry = record[key];
      if (typeof entry === "string" && entry.trim()) return entry.trim();
      if (typeof entry === "number" && Number.isFinite(entry)) return String(entry);
    }
  }
  return null;
}

function anonClient() {
  return createClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function settingsReader() {
  const { isServiceRoleConfigured } = await import("@/lib/supabase/service-role");
  if (isServiceRoleConfigured()) {
    const { createServiceClient } = await import("@/lib/supabase/server");
    return createServiceClient();
  }
  return anonClient();
}

export async function getStoreWhatsapp(): Promise<string | null> {
  if (isSupabaseConfigured()) {
    try {
      const { data } = await (await settingsReader()).from("settings").select("value").eq("key", "whatsapp_number").maybeSingle();
      const stored = readWhatsappValue(data?.value);
      const normalized = stored ? normalizeEgyptianMobile(stored) : null;
      if (normalized) return normalized;
    } catch {
      // The settings row is unavailable. Fall through to the env fallback.
    }
  }

  const fallback = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() ?? "";
  if (!fallback) return null;
  return normalizeEgyptianMobile(fallback);
}

export async function listPublicGovernorates(): Promise<string[]> {
  if (!isSupabaseConfigured()) {
    const { mockShippingRates } = await import("@/lib/mock-data");
    return mockShippingRates.map((rate) => rate.governorate);
  }

  try {
    const { data, error } = await anonClient().from("shipping_rates").select("governorate").order("governorate");
    if (error) return [];
    return (data ?? []).map((row) => row.governorate);
  } catch {
    return [];
  }
}
