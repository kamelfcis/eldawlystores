import type { Json } from "@/lib/types/database";

export const ADMIN_NOTIFICATION_EMAILS_KEY = "admin_notification_emails";
export const ADMIN_NOTIFICATION_EMAILS_MAX_COUNT = 10;
export const ADMIN_NOTIFICATION_EMAILS_MAX_CHARS = 2000;

export const ADMIN_NOTIFICATION_EMAIL_MESSAGES = {
  invalid: "من فضلك أدخل بريدًا إلكترونيًا صحيحًا.",
  duplicate: "هذا البريد الإلكتروني مضاف بالفعل.",
  maxCount: "لا يمكن إضافة أكثر من 10 عناوين بريد إلكتروني.",
  maxChars: "إجمالي طول عناوين البريد الإلكتروني تجاوز الحد المسموح.",
  empty: "من فضلك أدخل البريد الإلكتروني أولًا.",
} as const;

export type AdminNotificationEmailsSetting =
  | { kind: "missing" }
  | { kind: "saved"; emails: string[] }
  | { kind: "unavailable" };

export type AdminNotificationConfig =
  | { state: "missing" }
  | { state: "saved"; emails: string[] }
  | { state: "unavailable" };

export function normalizeAdminNotificationEmails(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const emails: string[] = [];
  for (const value of values) {
    const email = value.trim();
    if (!email) continue;
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    emails.push(email);
  }
  return emails;
}

export function parseAdminNotificationEmails(value: string | undefined): string[] {
  if (!value) return [];
  return normalizeAdminNotificationEmails(value.split(","));
}

export function parseStoredAdminNotificationEmails(value: Json | null | undefined): string[] {
  if (Array.isArray(value)) {
    return normalizeAdminNotificationEmails(value.filter((item): item is string => typeof item === "string"));
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[")) {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return normalizeAdminNotificationEmails(parsed.filter((item): item is string => typeof item === "string"));
        }
      } catch {
        return [];
      }
    }
    return parseAdminNotificationEmails(trimmed);
  }
  return [];
}

export function readAdminNotificationEmailsSetting(
  row: { value: Json } | null | undefined
): Extract<AdminNotificationEmailsSetting, { kind: "missing" | "saved" }> {
  if (!row) return { kind: "missing" };
  return { kind: "saved", emails: parseStoredAdminNotificationEmails(row.value) };
}

export function formEmailsFromAdminSetting(
  setting: AdminNotificationEmailsSetting,
  envValue: string | undefined
): { emails: string[]; emptyListSaved: boolean } {
  if (setting.kind === "saved") {
    return { emails: setting.emails, emptyListSaved: setting.emails.length === 0 };
  }
  if (setting.kind === "unavailable") {
    return { emails: [], emptyListSaved: false };
  }
  return { emails: parseAdminNotificationEmails(envValue), emptyListSaved: false };
}

export function resolveAdminNotificationEmails(
  config: AdminNotificationConfig,
  envValue: string | undefined = process.env.ADMIN_NOTIFICATION_EMAIL
): { emails: string[]; unavailable: boolean } {
  if (config.state === "unavailable") {
    return { emails: [], unavailable: true };
  }
  if (config.state === "missing") {
    return { emails: parseAdminNotificationEmails(envValue), unavailable: false };
  }
  return { emails: normalizeAdminNotificationEmails(config.emails), unavailable: false };
}

function isPracticalEmail(value: string): boolean {
  if (/javascript:/i.test(value)) return false;
  const at = value.indexOf("@");
  if (at <= 0 || at !== value.lastIndexOf("@")) return false;
  const domain = value.slice(at + 1);
  if (!domain.includes(".") || domain.startsWith(".") || domain.endsWith(".")) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validateAdminNotificationEmails(
  input: unknown
): { ok: true; emails: string[] } | { ok: false; error: string } {
  if (!Array.isArray(input)) {
    return { ok: false, error: ADMIN_NOTIFICATION_EMAIL_MESSAGES.invalid };
  }

  const emails: string[] = [];
  const seen = new Set<string>();
  let totalChars = 0;

  for (const item of input) {
    if (typeof item !== "string") {
      return { ok: false, error: ADMIN_NOTIFICATION_EMAIL_MESSAGES.invalid };
    }
    const email = item.trim();
    if (!email) {
      return { ok: false, error: ADMIN_NOTIFICATION_EMAIL_MESSAGES.empty };
    }
    if (!isPracticalEmail(email)) {
      return { ok: false, error: ADMIN_NOTIFICATION_EMAIL_MESSAGES.invalid };
    }
    const key = email.toLowerCase();
    if (seen.has(key)) {
      return { ok: false, error: ADMIN_NOTIFICATION_EMAIL_MESSAGES.duplicate };
    }
    seen.add(key);
    emails.push(email);
    totalChars += email.length;
    if (emails.length > ADMIN_NOTIFICATION_EMAILS_MAX_COUNT) {
      return { ok: false, error: ADMIN_NOTIFICATION_EMAIL_MESSAGES.maxCount };
    }
    if (totalChars > ADMIN_NOTIFICATION_EMAILS_MAX_CHARS) {
      return { ok: false, error: ADMIN_NOTIFICATION_EMAIL_MESSAGES.maxChars };
    }
  }

  return { ok: true, emails };
}

export async function loadAdminNotificationConfig(): Promise<AdminNotificationConfig> {
  try {
    const { isSupabaseConfigured } = await import("@/lib/supabase/config");
    const { isServiceRoleConfigured } = await import("@/lib/supabase/service-role");
    if (!isSupabaseConfigured() || !isServiceRoleConfigured()) {
      return { state: "missing" };
    }
    const { createServiceClient } = await import("@/lib/supabase/server");
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", ADMIN_NOTIFICATION_EMAILS_KEY)
      .maybeSingle();
    if (error) return { state: "unavailable" };
    if (!data) return { state: "missing" };
    return { state: "saved", emails: parseStoredAdminNotificationEmails(data.value) };
  } catch {
    return { state: "unavailable" };
  }
}
