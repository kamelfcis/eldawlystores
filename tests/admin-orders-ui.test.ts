import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const ordersList = readFileSync("app/(admin)/admin/orders/page.tsx", "utf8");
const orderDetail = readFileSync("app/(admin)/admin/orders/[id]/page.tsx", "utf8");
const statusForm = readFileSync("components/admin/order-status-form.tsx", "utf8");
const settingsPage = readFileSync("app/(admin)/admin/settings/page.tsx", "utf8");
const settingsForms = readFileSync("components/admin/settings-forms.tsx", "utf8");
const storeSettings = readFileSync("lib/store-settings.ts", "utf8");
const publicPolicy = readFileSync("supabase/migrations/20261008071216_settings_storefront_branding_read.sql", "utf8");

describe("admin orders list markup", () => {
  it("has a desktop header aligned with the order columns", () => {
    expect(ordersList).toContain("رقم الطلب");
    expect(ordersList).toContain("العميل");
    expect(ordersList).toContain("الهاتف");
    expect(ordersList).toContain("الإجمالي");
    expect(ordersList).toContain("التاريخ");
    expect(ordersList).toContain("الحالة");
    expect(ordersList).toContain("lg:grid-cols-[1.1fr_1fr_1fr_1fr_1.2fr_1.4fr]");
    expect(ordersList).toContain("href={`/admin/orders/${order.id}`}");
    expect(ordersList).toContain('dir="ltr"');
    expect(ordersList).toContain("formatMoney(order.totalPiasters)");
    expect(ordersList).toContain("AdminEmpty");
    expect(ordersList).toContain("AdminError");
    expect(ordersList).toContain('variant="outline"');
    expect(ordersList).toContain("min-h-10");
    expect(ordersList).toContain("الكل");
  });
});

describe("admin order detail markup", () => {
  it("keeps a two-column desktop layout with item columns and a back link", () => {
    expect(orderDetail).toContain("العودة إلى الطلبات");
    expect(orderDetail).toContain('href="/admin/orders"');
    expect(orderDetail).toContain("المنتج");
    expect(orderDetail).toContain("SKU");
    expect(orderDetail).toContain("الكمية");
    expect(orderDetail).toContain("الإجمالي");
    expect(orderDetail).toContain("formatMoney(lineTotal)");
    expect(orderDetail).toContain('dir="ltr"');
    expect(orderDetail).toContain("lg:grid-cols-[1.4fr_1fr]");
    expect(orderDetail).toContain("OrderStatusForm");
  });
});

describe("order status form", () => {
  it("uses h-10 controls and a single FormNote", () => {
    expect(statusForm).toContain("h-10");
    expect(statusForm).not.toContain("h-8");
    expect(statusForm.match(/<FormNote/g)).toHaveLength(1);
  });
});

describe("admin notification settings privacy", () => {
  it("keeps the inboxes section on settings and off the storefront reader", () => {
    expect(settingsPage).toContain("إيميلات إشعارات الطلبات");
    expect(settingsForms).toContain("لن يُرسل إشعار أدمن حتى تضيف عنواناً.");
    expect(settingsForms).toContain("تأكيد الحذف");
    expect(settingsForms).toContain("إلغاء");
    expect(settingsForms).not.toContain("window.confirm");
    expect(settingsForms).not.toContain("alert(");
    expect(storeSettings).not.toContain("admin_notification_emails");
    expect(readFileSync("lib/admin/notification-emails.ts", "utf8")).not.toContain("supabase/server");
    expect(publicPolicy).toContain("whatsapp_number");
    expect(publicPolicy).toContain("storefront_branding");
    expect(publicPolicy).not.toContain("admin_notification_emails");
  });
});
