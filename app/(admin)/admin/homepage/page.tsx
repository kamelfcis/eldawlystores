import Link from "next/link";
import { BannerForm, DeleteBannerForm, MoveBannerForm } from "@/components/admin/catalog-forms";
import {
  AdminEmpty,
  AdminError,
  AdminList,
  AdminListCell,
  AdminListRow,
  AdminPage,
  StatusPill,
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { getAdminBanners } from "@/lib/admin/queries";
import { isR2Configured } from "@/lib/storage";
import type { BannerType } from "@/lib/types/database";

export const metadata = { title: "إدارة الصفحة الرئيسية" };

const bannerColumns = "lg:grid-cols-[auto_1.6fr_auto_auto]";

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
              <Button asChild variant={formOpen ? "outline" : "default"}>
                <Link href={formOpen ? "/admin/homepage" : `/admin/homepage?edit=new&type=${section.type}`}>
                  {formOpen ? "إغلاق" : section.addLabel}
                </Link>
              </Button>
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
              <AdminList columns={["الصورة", "العنوان", "الحالة", "إجراء"]} gridClass={bannerColumns}>
                {rows.map((banner, index) => (
                  <AdminListRow key={banner.id} gridClass={bannerColumns}>
                    <AdminListCell label="الصورة">
                      {banner.image_url ? (
                        <img src={banner.image_url} alt="" className="h-16 w-24 rounded-[8px] object-cover" />
                      ) : (
                        <div className="h-16 w-24 rounded-[8px] border border-mist bg-fog" />
                      )}
                    </AdminListCell>
                    <AdminListCell label="العنوان">
                      <div className="min-w-0 text-[14px]">
                        <p className="text-carbon-ink">{banner.title_ar}</p>
                        {banner.subtitle_ar ? <p className="text-graphite">{banner.subtitle_ar}</p> : null}
                        {banner.link_url ? <p className="truncate text-graphite">{banner.link_url}</p> : null}
                      </div>
                    </AdminListCell>
                    <AdminListCell label="الحالة">
                      <StatusPill>{banner.is_active ? "نشط" : "معطل"}</StatusPill>
                    </AdminListCell>
                    <AdminListCell label="إجراء">
                      <div className="flex flex-wrap items-center gap-2">
                        <MoveBannerForm id={banner.id} direction="up" disabled={index === 0} />
                        <MoveBannerForm id={banner.id} direction="down" disabled={index === rows.length - 1} />
                        <Link
                          href={`/admin/homepage?edit=${banner.id}`}
                          className="inline-flex h-10 items-center text-[14px] font-bold tracking-[0.038em] text-carbon-ink underline-offset-2 hover:underline"
                        >
                          تعديل
                        </Link>
                        <DeleteBannerForm id={banner.id} />
                      </div>
                    </AdminListCell>
                  </AdminListRow>
                ))}
              </AdminList>
            )}
          </section>
        );
      })}
    </AdminPage>
  );
}
