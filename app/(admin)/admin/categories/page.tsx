import Link from "next/link";
import { CategoryForm, DeleteCategoryForm } from "@/components/admin/catalog-forms";
import { AdminEmpty, AdminError, AdminPage } from "@/components/admin/admin-ui";
import { getAdminCatalog } from "@/lib/admin/queries";
import { isR2Configured } from "@/lib/storage";

export const metadata = { title: "إدارة الفئات" };

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const params = await searchParams;
  const { categories, error } = await getAdminCatalog();
  const r2Enabled = isR2Configured();
  const editing = params.edit && params.edit !== "new" ? categories.find((category) => category.id === params.edit) : undefined;

  return (
    <AdminPage
      title="الفئات"
      action={
        <Link href={params.edit === "new" ? "/admin/categories" : "/admin/categories?edit=new"} className="text-[14px] font-bold tracking-[0.038em] text-carbon-ink">
          {params.edit === "new" ? "إغلاق" : "فئة جديدة"}
        </Link>
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
        <ul className="overflow-hidden rounded-[8px] border border-mist bg-paper-white">
          {categories.map((category) => (
            <li key={category.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-mist px-4 py-3 text-[14px] last:border-0">
              <div>
                <p>{category.name_ar}</p>
                <p className="font-mono text-graphite">{category.slug}</p>
                {category.description_ar ? <p className="text-graphite">{category.description_ar}</p> : null}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-graphite">{category.sort_order}</span>
                <Link href={`/admin/categories?edit=${category.id}`} className="font-bold tracking-[0.038em]">تعديل</Link>
                <DeleteCategoryForm id={category.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminPage>
  );
}
