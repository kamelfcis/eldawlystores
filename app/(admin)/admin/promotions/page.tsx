import Link from "next/link";
import { PromotionForm } from "@/components/admin/catalog-forms";
import { PromotionsList } from "@/components/admin/promotions-list";
import { AdminEmpty, AdminError, AdminPage } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
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
        <AdminEmpty>لا توجد عروض. استخدم عرض جديد في أعلى الصفحة.</AdminEmpty>
      ) : (
        <PromotionsList promotions={promotions} />
      )}
    </AdminPage>
  );
}
