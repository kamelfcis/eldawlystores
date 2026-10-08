import Link from "next/link";
import { BannerForm, DeleteBannerForm, MoveBannerForm } from "@/components/admin/catalog-forms";
import { AdminEmpty, AdminError, AdminPage, StatusPill } from "@/components/admin/admin-ui";
import { getAdminBanners } from "@/lib/admin/queries";
import { isR2Configured } from "@/lib/storage";
import type { BannerType } from "@/lib/types/database";

export const metadata = { title: "إدارة الصفحة الرئيسية" };

const addControlClass =
  "inline-flex h-10 shrink-0 items-center justify-center rounded-[4px] bg-carbon-ink px-4 text-[14px] font-bold text-paper-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carbon-ink focus-visible:ring-offset-2";

const SECTIONS: Array<{ type: BannerType; title: string; addLabel: string; helper: string }> = [
  {
    type: "hero",
    title: "سلايدر الغلاف",
    addLabel: "شريحة جديدة",
    helper: "شرائح الوسط 1600×900. كل غلاف نشط له صورة يدخل السلايدر حسب الترتيب.",
  },
  {
    type: "offer",
    title: "بطاقات العروض",
    addLabel: "عرض جديد",
    helper: "أول عرضين نشطين بصورة هما البطاقة اليسرى والبطاقة اليمنى بمقاس 800×1000. أي عرض إضافي يظهر في صف أسفل اللوحة.",
  },
  {
    type: "announcement",
    title: "شريط الإعلانات",
    addLabel: "رسالة جديدة",
    helper: "الرسائل النشطة تظهر في شريط الإعلانات أعلى الصفحة.",
  },
];

function isBannerType(value: string | undefined): value is BannerType {
  return value === "announcement" || value === "hero" || value === "offer";
}

export default async function AdminHomepagePage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; type?: string }>;
}) {
  const params = await searchParams;
  const { banners, error } = await getAdminBanners();
  const r2Enabled = isR2Configured();
  const editing = params.edit && params.edit !== "new" ? banners.find((banner) => banner.id === params.edit) : undefined;

  return (
    <AdminPage title="الصفحة الرئيسية">
      <AdminError message={error} />
      {params.edit && params.edit !== "new" && !editing ? <AdminEmpty>البانر غير موجود.</AdminEmpty> : null}
      {SECTIONS.map((section) => {
        const rows = banners
          .filter((banner) => banner.type === section.type)
          .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));
        const formOpen =
          (params.edit === "new" && isBannerType(params.type) && params.type === section.type) || editing?.type === section.type;
        return (
          <section key={section.type} id={section.type} className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[16px] font-bold text-carbon-ink">{section.title}</h2>
              <Link href={formOpen ? "/admin/homepage" : `/admin/homepage?edit=new&type=${section.type}`} className={addControlClass}>
                {formOpen ? "إغلاق" : section.addLabel}
              </Link>
            </div>
            <p className="text-[14px] text-graphite">{section.helper}</p>
            {formOpen ? (
              <div className="rounded-[8px] border border-mist bg-paper-white p-4">
                <BannerForm
                  banner={editing?.type === section.type ? editing : undefined}
                  r2Enabled={r2Enabled}
                  bannerType={section.type}
                />
              </div>
            ) : null}
            {rows.length === 0 ? (
              <AdminEmpty>لا توجد عناصر.</AdminEmpty>
            ) : (
              <ul className="overflow-hidden rounded-[8px] border border-mist bg-paper-white">
                {rows.map((banner, index) => (
                  <li key={banner.id} className="flex flex-wrap items-center gap-3 border-b border-mist px-4 py-3 last:border-0">
                    {banner.image_url ? (
                      <img src={banner.image_url} alt="" className="h-16 w-24 rounded-[8px] object-cover" />
                    ) : (
                      <div className="h-16 w-24 rounded-[8px] border border-mist bg-fog" />
                    )}
                    <div className="min-w-0 flex-1 text-[14px]">
                      <p className="text-carbon-ink">{banner.title_ar}</p>
                      {banner.subtitle_ar ? <p className="text-graphite">{banner.subtitle_ar}</p> : null}
                      {banner.link_url ? <p className="truncate text-graphite">{banner.link_url}</p> : null}
                    </div>
                    <StatusPill>{banner.is_active ? "نشط" : "معطل"}</StatusPill>
                    <MoveBannerForm id={banner.id} direction="up" disabled={index === 0} />
                    <MoveBannerForm id={banner.id} direction="down" disabled={index === rows.length - 1} />
                    <Link href={`/admin/homepage?edit=${banner.id}`} className="text-[14px] font-bold tracking-[0.038em]">
                      تعديل
                    </Link>
                    <DeleteBannerForm id={banner.id} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </AdminPage>
  );
}
