import {
  ADMIN_NOTIFICATION_EMAILS_KEY,
  parseStoredAdminNotificationEmails,
  type AdminNotificationConfig,
} from "@/lib/admin/notification-emails";

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
