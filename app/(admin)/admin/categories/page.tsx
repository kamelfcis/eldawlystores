import Link from "next/link";
import { CategoryForm, DeleteCategoryForm } from "@/components/admin/catalog-forms";
import { AdminEmpty, AdminError, AdminList, AdminListCell, AdminListRow, AdminPage } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { getAdminCatalog } from "@/lib/admin/queries";
import { isR2Configured } from "@/lib/storage";

export const metadata = { title: "إدارة الفئات" };

const categoryColumns = "lg:grid-cols-[1.4fr_1fr_2fr_auto]";

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const params = await searchParams;
  const { categories, error } = await getAdminCatalog();
  const r2Enabled = isR2Configured();
  const editing = params.edit && params.edit !== "new" ? categories.find((category) => category.id === params.edit) : undefined;
  const creating = params.edit === "new";

  return (
    <AdminPage
      title="الفئات"
      action={
        <Button asChild variant="outline">
          <Link href={creating ? "/admin/categories" : "/admin/categories?edit=new"}>
            {creating ? "إغلاق" : "فئة جديدة"}
          </Link>
        </Button>
      }
    >
      <AdminError message={error} />
      {params.edit ? (
        <section className="rounded-[8px] border border-mist bg-paper-white p-4">
          {params.edit !== "new" && !editing ? (
            <AdminEmpty>الفئة غير موجودة.</AdminEmpty>
          ) : (
            <CategoryForm category={editing} r2Enabled={r2Enabled} />
          )}
        </section>
      ) : null}
      {categories.length === 0 ? (
        <AdminEmpty>لا توجد فئات.</AdminEmpty>
      ) : (
        <AdminList columns={["الاسم", "المسار", "الوصف", "إجراء"]} gridClass={categoryColumns}>
          {categories.map((category) => (
            <AdminListRow key={category.id} gridClass={categoryColumns}>
              <AdminListCell label="الاسم">
                <span className="text-carbon-ink">{category.name_ar}</span>
              </AdminListCell>
              <AdminListCell label="المسار">
                <span className="font-mono text-graphite">{category.slug}</span>
              </AdminListCell>
              <AdminListCell label="الوصف">
                <span className="text-graphite">{category.description_ar || "—"}</span>
              </AdminListCell>
              <AdminListCell label="إجراء">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-graphite">ترتيب {category.sort_order}</span>
                  <Link
                    href={`/admin/categories?edit=${category.id}`}
                    className="inline-flex h-10 items-center font-bold tracking-[0.038em] text-carbon-ink underline-offset-2 hover:underline"
                  >
                    تعديل
                  </Link>
                  <DeleteCategoryForm id={category.id} />
                </div>
              </AdminListCell>
            </AdminListRow>
          ))}
        </AdminList>
      )}
    </AdminPage>
  );
}
