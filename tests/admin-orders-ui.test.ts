import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { customerTelHref, customerWhatsAppHref } from "@/lib/orders/customer-contact";
import { allowedOrderStatuses, validTransitions } from "@/lib/orders/transitions";

const ordersList = readFileSync("app/(admin)/admin/orders/page.tsx", "utf8");
const orderDetail = readFileSync("app/(admin)/admin/orders/[id]/page.tsx", "utf8");
const statusForm = readFileSync("components/admin/order-status-form.tsx", "utf8");
const ordersLib = readFileSync("lib/orders/index.ts", "utf8");
const customerContact = readFileSync("lib/orders/customer-contact.ts", "utf8");
const adminUi = readFileSync("components/admin/admin-ui.tsx", "utf8");
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
    expect(ordersList).toContain("adminFilterChipClass");
    expect(adminUi).toContain("min-h-10");
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
    expect(orderDetail).toContain("سعر الوحدة");
    expect(orderDetail).toContain("الإجمالي");
    expect(orderDetail).toContain("formatMoney(lineTotal)");
    expect(orderDetail).toContain('dir="ltr"');
    expect(orderDetail).toContain("lg:grid-cols-[1.4fr_1fr]");
    expect(orderDetail).toContain("OrderStatusForm");
    expect(orderDetail).toContain("فرعي");
    expect(orderDetail).toContain("شحن");
    expect(orderDetail).toContain("خصم");
    expect(orderDetail).toContain("customerTelHref");
    expect(orderDetail).toContain("customerWhatsAppHref");
    expect(customerContact).toContain("tel:");
    expect(customerContact).toContain("wa.me");
    expect(orderDetail).toContain("سجل الحالة");
    expect(orderDetail).toContain("border-s border-mist");
    expect(orderDetail).not.toContain("بيانات الطلب");
  });

  it("selects variant_id and maps thumbs in getAdminOrder", () => {
    expect(ordersLib).toContain("variant_id");
    expect(ordersLib).toContain("loadOrderItemImageUrls");
    expect(ordersLib).toContain("PLACEHOLDER_PRODUCT_IMAGE");
  });
});

describe("order status form", () => {
  it("uses h-10 controls and useFormToast instead of FormNote", () => {
    expect(statusForm).toContain("h-10");
    expect(statusForm).not.toContain("h-8");
    expect(statusForm).not.toContain("FormNote");
    expect(statusForm).toContain("useFormToast");
    expect(statusForm).toContain("تم تحديث حالة الطلب");
  });

  it("restricts options to exported transitions and disables unchanged or terminal saves", () => {
    expect(statusForm).toContain("allowedOrderStatuses");
    expect(statusForm).toContain("allowedStatuses");
    expect(statusForm).not.toContain("Object.keys(statusLabels)");
    expect(statusForm).toContain("لا يمكن تغيير الحالة");
    expect(statusForm).toContain("terminal || unchanged");
    expect(ordersList).toContain("allowedOrderStatuses(order.status)");
  });
});

describe("allowedOrderStatuses", () => {
  it("returns current then unique next statuses", () => {
    expect(allowedOrderStatuses("pending")).toEqual(["pending", "confirmed", "cancelled", "rejected"]);
    expect(allowedOrderStatuses("confirmed")).toEqual(["confirmed", "shipped", "cancelled"]);
    expect(allowedOrderStatuses("shipped")).toEqual(["shipped", "delivered", "cancelled"]);
    expect(allowedOrderStatuses("delivered")).toEqual(["delivered"]);
    expect(allowedOrderStatuses("cancelled")).toEqual(["cancelled"]);
    expect(allowedOrderStatuses("rejected")).toEqual(["rejected"]);
    expect(validTransitions.pending).toEqual(["confirmed", "cancelled", "rejected"]);
    expect(validTransitions.delivered).toEqual([]);
  });
});

describe("customerWhatsAppHref", () => {
  it("normalizes Egyptian prefixes and rejects unusable values", () => {
    expect(customerWhatsAppHref("01012345678")).toBe("https://wa.me/201012345678");
    expect(customerWhatsAppHref("+20 1012345678")).toBe("https://wa.me/201012345678");
    expect(customerWhatsAppHref("00201012345678")).toBe("https://wa.me/201012345678");
    expect(customerWhatsAppHref("201012345678")).toBe("https://wa.me/201012345678");
    expect(customerWhatsAppHref("not-a-phone")).toBeNull();
    expect(customerTelHref("01012345678")).toBe("tel:01012345678");
    expect(customerTelHref("ab")).toBeNull();
  });
});

describe("admin notification settings privacy", () => {
  it("keeps the inboxes section on settings and off the storefront reader", () => {
    expect(settingsPage).toContain("إيميلات إشعارات الطلبات");
    expect(settingsPage).toContain("?tab=");
    expect(settingsForms).toContain("لن يُرسل إشعار أدمن حتى تضيف عنواناً.");
    expect(settingsForms).toContain('role="switch"');
    expect(settingsForms).toContain("تفعيل");
    expect(settingsForms).toContain("إيقاف");
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

describe("admin shipping filters markup", () => {
  it("keeps count, clear, range-only fields, and AdminList headers", () => {
    expect(settingsForms).toContain("محافظة من أصل");
    expect(settingsForms).toContain("مسح التصفية");
    expect(settingsForms).toContain("لا توجد محافظات مطابقة.");
    expect(settingsForms).toContain('columns={["المحافظة", "الرسوم", "حفظ"]}');
    expect(settingsForms).toContain('band === "range"');
    expect(settingsForms).toContain("filterShippingRates");
    expect(settingsPage).toContain("?tab=");
    expect(settingsPage).toContain('aria-current={tab === item.id ? "page" : undefined}');
  });
});
