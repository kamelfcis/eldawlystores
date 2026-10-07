import Link from "next/link";
import { DeletePromotionForm, PromotionForm } from "@/components/admin/catalog-forms";
import { AdminEmpty, AdminError, AdminPage, StatusPill } from "@/components/admin/admin-ui";
import { formatMoney } from "@/lib/money";
import { getAdminPromotions } from "@/lib/admin/queries";

export const metadata = { title: "إدارة العروض" };

export default async function AdminPromotionsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const params = await searchParams;
  const { promotions, error } = await getAdminPromotions();
  const editing = params.edit && params.edit !== "new" ? promotions.find((promotion) => promotion.id === params.edit) : undefined;

  return (
    <AdminPage
      title="العروض"
      action={
        <Link href={params.edit === "new" ? "/admin/promotions" : "/admin/promotions?edit=new"} className="text-[14px] font-bold tracking-[0.038em] text-carbon-ink">
          {params.edit === "new" ? "إغلاق" : "عرض جديد"}
        </Link>
      }
    >
      <AdminError message={error} />
      {params.edit ? (
        <section className="rounded-[8px] border border-mist bg-paper-white p-4">
          {params.edit !== "new" && !editing ? (
            <AdminEmpty>العرض غير موجود.</AdminEmpty>
          ) : (
            <PromotionForm promotion={editing} />
          )}
        </section>
      ) : null}
      {promotions.length === 0 ? (
        <AdminEmpty>لا توجد عروض.</AdminEmpty>
      ) : (
        <ul className="overflow-hidden rounded-[8px] border border-mist bg-paper-white">
          {promotions.map((promotion) => (
            <li key={promotion.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-mist px-4 py-3 text-[14px] last:border-0">
              <div>
                <p className="font-mono">{promotion.code}</p>
                <p className="text-graphite">
                  {promotion.discount_type === "percentage" ? `${promotion.discount_value}%` : formatMoney(promotion.discount_value)}
                  {" · "}
                  حد أدنى {formatMoney(promotion.min_order_piasters)}
                  {" · "}
                  {promotion.used_count}/{promotion.max_uses ?? "∞"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusPill>{promotion.is_active ? "نشط" : "معطل"}</StatusPill>
                <Link href={`/admin/promotions?edit=${promotion.id}`} className="font-bold tracking-[0.038em]">تعديل</Link>
                <DeletePromotionForm id={promotion.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminPage>
  );
}
