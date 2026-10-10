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

export type AdminNotificationInbox = {
  email: string;
  enabled: boolean;
};

export type AdminNotificationEmailsSetting =
  | { kind: "missing" }
  | { kind: "saved"; inboxes: AdminNotificationInbox[] }
  | { kind: "unavailable" };

export type AdminNotificationConfig =
  | { state: "missing" }
  | { state: "saved"; inboxes: AdminNotificationInbox[] }
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

export function normalizeAdminNotificationInboxes(
  values: readonly AdminNotificationInbox[]
): AdminNotificationInbox[] {
  const seen = new Set<string>();
  const inboxes: AdminNotificationInbox[] = [];
  for (const value of values) {
    const email = value.email.trim();
    if (!email) continue;
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    inboxes.push({ email, enabled: value.enabled !== false });
  }
  return inboxes;
}

export function enabledAdminNotificationEmails(inboxes: readonly AdminNotificationInbox[]): string[] {
  return normalizeAdminNotificationEmails(inboxes.filter((inbox) => inbox.enabled).map((inbox) => inbox.email));
}

export function parseAdminNotificationEmails(value: string | undefined): string[] {
  if (!value) return [];
  return normalizeAdminNotificationEmails(value.split(","));
}

function inboxFromUnknown(item: unknown): AdminNotificationInbox | null {
  if (typeof item === "string") {
    const email = item.trim();
    return email ? { email, enabled: true } : null;
  }
  if (!item || typeof item !== "object") return null;
  const record = item as { email?: unknown; enabled?: unknown };
  if (typeof record.email !== "string") return null;
  const email = record.email.trim();
  if (!email) return null;
  return { email, enabled: record.enabled !== false };
}

export function parseStoredAdminNotificationInboxes(value: Json | null | undefined): AdminNotificationInbox[] {
  if (Array.isArray(value)) {
    return normalizeAdminNotificationInboxes(
      value.flatMap((item) => {
        const inbox = inboxFromUnknown(item);
        return inbox ? [inbox] : [];
      })
    );
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[")) {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return normalizeAdminNotificationInboxes(
            parsed.flatMap((item) => {
              const inbox = inboxFromUnknown(item);
              return inbox ? [inbox] : [];
            })
          );
        }
      } catch {
        return [];
      }
    }
    return normalizeAdminNotificationEmails(trimmed.split(",")).map((email) => ({ email, enabled: true }));
  }
  return [];
}

export function parseStoredAdminNotificationEmails(value: Json | null | undefined): string[] {
  return enabledAdminNotificationEmails(parseStoredAdminNotificationInboxes(value));
}

export function readAdminNotificationEmailsSetting(
  row: { value: Json } | null | undefined
): Extract<AdminNotificationEmailsSetting, { kind: "missing" | "saved" }> {
  if (!row) return { kind: "missing" };
  return { kind: "saved", inboxes: parseStoredAdminNotificationInboxes(row.value) };
}

export function formEmailsFromAdminSetting(
  setting: AdminNotificationEmailsSetting,
  envValue: string | undefined
): { inboxes: AdminNotificationInbox[]; emptyListSaved: boolean } {
  if (setting.kind === "saved") {
    return { inboxes: setting.inboxes, emptyListSaved: setting.inboxes.length === 0 };
  }
  if (setting.kind === "unavailable") {
    return { inboxes: [], emptyListSaved: false };
  }
  return {
    inboxes: parseAdminNotificationEmails(envValue).map((email) => ({ email, enabled: true })),
    emptyListSaved: false,
  };
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
  return { emails: enabledAdminNotificationEmails(config.inboxes), unavailable: false };
}

function isPracticalEmail(value: string): boolean {
  if (/javascript:/i.test(value)) return false;
  const at = value.indexOf("@");
  if (at <= 0 || at !== value.lastIndexOf("@")) return false;
  const domain = value.slice(at + 1);
  if (!domain.includes(".") || domain.startsWith(".") || domain.endsWith(".")) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateInboxItem(item: unknown): { ok: true; inbox: AdminNotificationInbox } | { ok: false; error: string } {
  if (typeof item === "string") {
    const email = item.trim();
    if (!email) return { ok: false, error: ADMIN_NOTIFICATION_EMAIL_MESSAGES.empty };
    if (!isPracticalEmail(email)) return { ok: false, error: ADMIN_NOTIFICATION_EMAIL_MESSAGES.invalid };
    return { ok: true, inbox: { email, enabled: true } };
  }
  if (!item || typeof item !== "object") {
    return { ok: false, error: ADMIN_NOTIFICATION_EMAIL_MESSAGES.invalid };
  }
  const record = item as { email?: unknown; enabled?: unknown };
  if (typeof record.email !== "string") {
    return { ok: false, error: ADMIN_NOTIFICATION_EMAIL_MESSAGES.invalid };
  }
  const email = record.email.trim();
  if (!email) return { ok: false, error: ADMIN_NOTIFICATION_EMAIL_MESSAGES.empty };
  if (!isPracticalEmail(email)) return { ok: false, error: ADMIN_NOTIFICATION_EMAIL_MESSAGES.invalid };
  if (record.enabled !== undefined && typeof record.enabled !== "boolean") {
    return { ok: false, error: ADMIN_NOTIFICATION_EMAIL_MESSAGES.invalid };
  }
  return { ok: true, inbox: { email, enabled: record.enabled !== false } };
}

export function validateAdminNotificationEmails(
  input: unknown
): { ok: true; inboxes: AdminNotificationInbox[] } | { ok: false; error: string } {
  if (!Array.isArray(input)) {
    return { ok: false, error: ADMIN_NOTIFICATION_EMAIL_MESSAGES.invalid };
  }

  const inboxes: AdminNotificationInbox[] = [];
  const seen = new Set<string>();
  let totalChars = 0;

  for (const item of input) {
    const parsed = validateInboxItem(item);
    if (!parsed.ok) return parsed;
    const key = parsed.inbox.email.toLowerCase();
    if (seen.has(key)) {
      return { ok: false, error: ADMIN_NOTIFICATION_EMAIL_MESSAGES.duplicate };
    }
    seen.add(key);
    inboxes.push(parsed.inbox);
    totalChars += parsed.inbox.email.length;
    if (inboxes.length > ADMIN_NOTIFICATION_EMAILS_MAX_COUNT) {
      return { ok: false, error: ADMIN_NOTIFICATION_EMAIL_MESSAGES.maxCount };
    }
    if (totalChars > ADMIN_NOTIFICATION_EMAILS_MAX_CHARS) {
      return { ok: false, error: ADMIN_NOTIFICATION_EMAIL_MESSAGES.maxChars };
    }
  }

  return { ok: true, inboxes };
}
