import Link from "next/link";
import { DeletePromotionForm, PromotionForm } from "@/components/admin/catalog-forms";
import { AdminEmpty, AdminError, AdminList, AdminListCell, AdminListRow, AdminPage, StatusPill } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { getAdminPromotions } from "@/lib/admin/queries";

export const metadata = { title: "إدارة العروض" };

const promotionColumns = "lg:grid-cols-[1fr_1.6fr_auto_auto]";

export default async function AdminPromotionsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const params = await searchParams;
  const { promotions, error } = await getAdminPromotions();
  const editing = params.edit && params.edit !== "new" ? promotions.find((promotion) => promotion.id === params.edit) : undefined;
  const creating = params.edit === "new";

  return (
    <AdminPage
      title="العروض"
      action={
        <Button asChild variant="outline">
          <Link href={creating ? "/admin/promotions" : "/admin/promotions?edit=new"}>
            {creating ? "إغلاق" : "عرض جديد"}
          </Link>
        </Button>
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
        <AdminList columns={["الكود", "الخصم", "الحالة", "إجراء"]} gridClass={promotionColumns}>
          {promotions.map((promotion) => (
            <AdminListRow key={promotion.id} gridClass={promotionColumns}>
              <AdminListCell label="الكود">
                <span className="font-mono text-carbon-ink">{promotion.code}</span>
              </AdminListCell>
              <AdminListCell label="الخصم">
                <span className="text-graphite">
                  {promotion.discount_type === "percentage" ? `${promotion.discount_value}%` : formatMoney(promotion.discount_value)}
                  {" · "}
                  حد أدنى {formatMoney(promotion.min_order_piasters)}
                  {" · "}
                  {promotion.used_count}/{promotion.max_uses ?? "∞"}
                </span>
              </AdminListCell>
              <AdminListCell label="الحالة">
                <StatusPill>{promotion.is_active ? "نشط" : "معطل"}</StatusPill>
              </AdminListCell>
              <AdminListCell label="إجراء">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/promotions?edit=${promotion.id}`}
                    className="inline-flex h-10 items-center font-bold tracking-[0.038em] text-carbon-ink underline-offset-2 hover:underline"
                  >
                    تعديل
                  </Link>
                  <DeletePromotionForm id={promotion.id} />
                </div>
              </AdminListCell>
            </AdminListRow>
          ))}
        </AdminList>
      )}
    </AdminPage>
  );
}
