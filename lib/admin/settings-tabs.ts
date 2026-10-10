export const ADMIN_SETTINGS_TABS = [
  { id: "branding", label: "الهوية" },
  { id: "whatsapp", label: "واتساب" },
  { id: "emails", label: "إيميلات إشعارات الطلبات" },
  { id: "shipping", label: "رسوم الشحن" },
] as const;

export type AdminSettingsTab = (typeof ADMIN_SETTINGS_TABS)[number]["id"];

export function parseAdminSettingsTab(value: string | undefined): AdminSettingsTab {
  if (value === "whatsapp" || value === "emails" || value === "shipping") return value;
  return "branding";
}
