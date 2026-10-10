import { AdminError, AdminPage, adminFilterChipClass } from "@/components/admin/admin-ui";
import { BrandingForm } from "@/components/admin/branding-form";
import { AdminNotificationEmailsForm, ShippingRatesPanel, WhatsappForm } from "@/components/admin/settings-forms";
import { formEmailsFromAdminSetting } from "@/lib/admin/notification-emails";
import { getAdminSettings } from "@/lib/admin/queries";
import { ADMIN_SETTINGS_TABS, parseAdminSettingsTab } from "@/lib/admin/settings-tabs";
import { isR2Configured } from "@/lib/storage";
import Link from "next/link";

export const metadata = { title: "الإعدادات" };

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const tab = parseAdminSettingsTab(params.tab);
  const { whatsapp, branding, adminNotificationEmails, rates, error } = await getAdminSettings();
  const r2Enabled = isR2Configured();
  const notificationForm = formEmailsFromAdminSetting(
    adminNotificationEmails,
    process.env.ADMIN_NOTIFICATION_EMAIL
  );

  return (
    <AdminPage title="الإعدادات">
      <AdminError message={error} />
      <nav
        className="sticky top-0 z-10 -mx-4 flex flex-wrap gap-2 border-b border-mist bg-fog px-4 py-2 md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:py-0"
        aria-label="أقسام الإعدادات"
      >
        {ADMIN_SETTINGS_TABS.map((item) => (
          <Link
            key={item.id}
            href={`/admin/settings?tab=${item.id}`}
            className={adminFilterChipClass(tab === item.id)}
            aria-current={tab === item.id ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {tab === "branding" ? (
        <section className="rounded-[8px] border border-mist bg-paper-white p-4">
          <h2 className="mb-3 text-[14px] font-bold tracking-[0.038em]">الهوية</h2>
          <p className="mb-3 text-[14px] text-graphite">الشعار وألوان شريط الإعلان. نصوص الإعلان تُدار من الصفحة الرئيسية.</p>
          <BrandingForm branding={branding} r2Enabled={r2Enabled} />
        </section>
      ) : null}
      {tab === "whatsapp" ? (
        <section className="rounded-[8px] border border-mist bg-paper-white p-4">
          <h2 className="mb-3 text-[14px] font-bold tracking-[0.038em]">واتساب</h2>
          <p className="mb-3 text-[14px] text-graphite">
            رقم المتجر الظاهر للعملاء. إذا تُرك بدون صف محفوظ يستخدم المتجر الرقم الاحتياطي من التشغيل، دون عرضه هنا.
          </p>
          <WhatsappForm number={whatsapp ?? ""} />
        </section>
      ) : null}
      {tab === "emails" ? (
        <section className="rounded-[8px] border border-mist bg-paper-white p-4">
          <h2 className="mb-3 text-[14px] font-bold tracking-[0.038em]">إيميلات إشعارات الطلبات</h2>
          <p className="mb-3 text-[14px] text-graphite">
            العناوين التي تستقبل إشعارات الطلبات الجديدة. العناوين المعطّلة تبقى في القائمة ولا تُرسل إليها.
          </p>
          <AdminNotificationEmailsForm
            key={`${notificationForm.emptyListSaved}:${notificationForm.inboxes
              .map((inbox) => `${inbox.email}:${inbox.enabled ? "1" : "0"}`)
              .join("|")}`}
            inboxes={notificationForm.inboxes}
            emptyListSaved={notificationForm.emptyListSaved}
          />
        </section>
      ) : null}
      {tab === "shipping" ? (
        <section className="space-y-4 rounded-[8px] border border-mist bg-paper-white p-4">
          <h2 className="text-[14px] font-bold tracking-[0.038em]">رسوم الشحن</h2>
          <p className="text-[14px] text-graphite">المبلغ بالجنيه. الطلب التالي يستخدم السعر المحفوظ.</p>
          <ShippingRatesPanel rates={rates} />
        </section>
      ) : null}
    </AdminPage>
  );
}
