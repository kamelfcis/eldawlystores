import Link from "next/link";
import { BrandForm, DeleteBrandForm } from "@/components/admin/catalog-forms";
import { AdminEmpty, AdminError, AdminPage } from "@/components/admin/admin-ui";
import { getAdminCatalog } from "@/lib/admin/queries";
import { isR2Configured } from "@/lib/storage";

export const metadata = { title: "إدارة العلامات" };

export default async function AdminBrandsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const params = await searchParams;
  const { brands, error } = await getAdminCatalog();
  const r2Enabled = isR2Configured();
  const editing = params.edit && params.edit !== "new" ? brands.find((brand) => brand.id === params.edit) : undefined;

  return (
    <AdminPage
      title="العلامات"
      action={
        <Link href={params.edit === "new" ? "/admin/brands" : "/admin/brands?edit=new"} className="text-[14px] font-bold tracking-[0.038em] text-carbon-ink">
          {params.edit === "new" ? "إغلاق" : "علامة جديدة"}
        </Link>
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
        <ul className="overflow-hidden rounded-[8px] border border-mist bg-paper-white">
          {brands.map((brand) => (
            <li key={brand.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-mist px-4 py-3 text-[14px] last:border-0">
              <div className="flex items-center gap-3">
                {brand.logo_url ? <img src={brand.logo_url} alt="" className="h-10 w-10 rounded-[8px] object-cover" /> : <span className="block h-10 w-10 rounded-[8px] bg-fog" />}
                <div>
                  <p>{brand.name}</p>
                  <p className="font-mono text-graphite">{brand.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link href={`/admin/brands?edit=${brand.id}`} className="font-bold tracking-[0.038em]">تعديل</Link>
                <DeleteBrandForm id={brand.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminPage>
  );
}
