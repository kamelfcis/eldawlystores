import Link from "next/link";
import { BrandForm, DeleteBrandForm } from "@/components/admin/catalog-forms";
import { AdminEmpty, AdminError, AdminList, AdminListCell, AdminListRow, AdminPage } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { getAdminCatalog } from "@/lib/admin/queries";
import { isR2Configured } from "@/lib/storage";

export const metadata = { title: "إدارة العلامات" };

const brandColumns = "lg:grid-cols-[auto_1.4fr_1fr_auto]";

export default async function AdminBrandsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const params = await searchParams;
  const { brands, error } = await getAdminCatalog();
  const r2Enabled = isR2Configured();
  const editing = params.edit && params.edit !== "new" ? brands.find((brand) => brand.id === params.edit) : undefined;
  const creating = params.edit === "new";

  return (
    <AdminPage
      title="العلامات"
      action={
        <Button asChild variant="outline">
          <Link href={creating ? "/admin/brands" : "/admin/brands?edit=new"}>
            {creating ? "إغلاق" : "علامة جديدة"}
          </Link>
        </Button>
      }
    >
      <AdminError message={error} />
      {params.edit ? (
        <section className="rounded-[8px] border border-mist bg-paper-white p-4">
          {params.edit !== "new" && !editing ? (
            <AdminEmpty>العلامة غير موجودة.</AdminEmpty>
          ) : (
            <BrandForm brand={editing} r2Enabled={r2Enabled} />
          )}
        </section>
      ) : null}
      {brands.length === 0 ? (
        <AdminEmpty>لا توجد علامات.</AdminEmpty>
      ) : (
        <AdminList columns={["الشعار", "الاسم", "المسار", "إجراء"]} gridClass={brandColumns}>
          {brands.map((brand) => (
            <AdminListRow key={brand.id} gridClass={brandColumns}>
              <AdminListCell label="الشعار">
                {brand.logo_url ? (
                  <img src={brand.logo_url} alt="" className="h-10 w-10 rounded-[8px] object-cover" />
                ) : (
                  <span className="block h-10 w-10 rounded-[8px] bg-fog" />
                )}
              </AdminListCell>
              <AdminListCell label="الاسم">
                <span className="text-carbon-ink">{brand.name}</span>
              </AdminListCell>
              <AdminListCell label="المسار">
                <span className="font-mono text-graphite">{brand.slug}</span>
              </AdminListCell>
              <AdminListCell label="إجراء">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/brands?edit=${brand.id}`}
                    className="inline-flex h-10 items-center font-bold tracking-[0.038em] text-carbon-ink underline-offset-2 hover:underline"
                  >
                    تعديل
                  </Link>
                  <DeleteBrandForm id={brand.id} />
                </div>
              </AdminListCell>
            </AdminListRow>
          ))}
        </AdminList>
      )}
    </AdminPage>
  );
}
