import { AdminError, AdminPage } from "@/components/admin/admin-ui";
import { BrandingForm } from "@/components/admin/branding-form";
import { AdminNotificationEmailsForm, ShippingRateForm, WhatsappForm } from "@/components/admin/settings-forms";
import { formEmailsFromAdminSetting } from "@/lib/admin/notification-emails";
import { formatMoney } from "@/lib/money";
import { getAdminSettings } from "@/lib/admin/queries";
import { isR2Configured } from "@/lib/storage";

export const metadata = { title: "الإعدادات" };

export default async function AdminSettingsPage() {
  const { whatsapp, branding, adminNotificationEmails, rates, error } = await getAdminSettings();
  const r2Enabled = isR2Configured();
  const notificationForm = formEmailsFromAdminSetting(
    adminNotificationEmails,
    process.env.ADMIN_NOTIFICATION_EMAIL
  );

  return (
    <AdminPage title="الإعدادات">
      <AdminError message={error} />
      <section className="rounded-[8px] border border-mist bg-paper-white p-4">
        <h2 className="mb-3 text-[14px] font-bold tracking-[0.038em]">الهوية</h2>
        <p className="mb-3 text-[14px] text-graphite">الشعار وألوان شريط الإعلان. نصوص الإعلان تُدار من الصفحة الرئيسية.</p>
        <BrandingForm branding={branding} r2Enabled={r2Enabled} />
      </section>
      <section className="rounded-[8px] border border-mist bg-paper-white p-4">
        <h2 className="mb-3 text-[14px] font-bold tracking-[0.038em]">واتساب</h2>
        <WhatsappForm number={whatsapp ?? ""} />
        <h2 className="mb-3 mt-8 text-[14px] font-bold tracking-[0.038em]">إيميلات إشعارات الطلبات</h2>
        <AdminNotificationEmailsForm
          key={`${notificationForm.emptyListSaved}:${notificationForm.emails.join("|")}`}
          emails={notificationForm.emails}
          emptyListSaved={notificationForm.emptyListSaved}
        />
      </section>
      <section className="space-y-4 rounded-[8px] border border-mist bg-paper-white p-4">
        <h2 className="text-[14px] font-bold tracking-[0.038em]">رسوم الشحن</h2>
        <p className="text-[14px] text-graphite">المبلغ بالقرش، وبجانبه القيمة بالجنيه. الطلب التالي يستخدم السعر المحفوظ.</p>
        {rates.length === 0 ? <p className="text-[14px] text-graphite">لا توجد محافظات بعد.</p> : null}
        <ul className="space-y-4">
          {rates.map((rate) => (
            <li key={rate.id} className="border-b border-mist pb-4 last:border-0">
              <p className="mb-2 text-[12px] text-graphite">الحالي {formatMoney(rate.rate_piasters)}</p>
              <ShippingRateForm id={rate.id} governorate={rate.governorate} ratePiasters={rate.rate_piasters} />
            </li>
          ))}
        </ul>
        <div className="border-t border-mist pt-4">
          <h3 className="mb-3 text-[14px] font-bold tracking-[0.038em]">محافظة جديدة</h3>
          <ShippingRateForm />
        </div>
      </section>
    </AdminPage>
  );
}
