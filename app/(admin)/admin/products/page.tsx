import Link from "next/link";
import { ArchiveProductForm, DeleteProductForm, ProductForm } from "@/components/admin/catalog-forms";
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
import { Input } from "@/components/ui/input";
import { adminProductExportQuery, getAdminCatalog, parseAdminCatalogFilters } from "@/lib/admin/queries";
import { formatMoney } from "@/lib/money";
import { isR2Configured } from "@/lib/storage";
import type { ProductStatus } from "@/lib/types/database";

export const metadata = { title: "إدارة المنتجات" };

const statusLabel: Record<ProductStatus, string> = { draft: "مسودة", active: "نشط", archived: "مؤرشف" };
const fieldClass =
  "flex h-10 w-full rounded-[4px] border border-ash-border bg-paper-white px-3 text-[14px] text-carbon-ink";
const productColumns = "lg:grid-cols-[auto_1.6fr_1fr_1fr_0.8fr_auto_auto]";

function productBadge(stock: number, price: number, compareAt: number | null): string | null {
  if (stock <= 5) return "مخزون منخفض";
  if (compareAt != null && compareAt > price) return "خصم";
  return null;
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    name?: string;
    sku?: string;
    category?: string;
    brand?: string;
    status?: string;
    stock?: string;
    view?: string;
    edit?: string;
  }>;
}) {
  const params = await searchParams;
  const filters = parseAdminCatalogFilters(params);
  const view = params.view === "table" ? "table" : "cards";
  const { products, categories, brands, error } = await getAdminCatalog(filters);
  const r2Enabled = isR2Configured();
  const categoryOptions = categories.map((category) => ({ id: category.id, label: category.name_ar }));
  const brandOptions = brands.map((brand) => ({ id: brand.id, label: brand.name }));
  const exportHref = `/api/admin/export?${adminProductExportQuery(filters)}`;
  const editing = params.edit && params.edit !== "new" ? products.find((product) => product.id === params.edit) : undefined;
  const showForm = params.edit === "new" || Boolean(params.edit);

  function href(patch: Record<string, string | null>) {
    const next = new URLSearchParams();
    if (filters.name) next.set("name", filters.name);
    if (filters.sku) next.set("sku", filters.sku);
    if (filters.categoryId) next.set("category", filters.categoryId);
    if (filters.brandId) next.set("brand", filters.brandId);
    if (filters.status) next.set("status", filters.status);
    if (filters.stock) next.set("stock", filters.stock);
    next.set("view", view);
    for (const [key, value] of Object.entries(patch)) {
      if (value == null) next.delete(key);
      else next.set(key, value);
    }
    const query = next.toString();
    return query ? `/admin/products?${query}` : "/admin/products";
  }

  return (
    <AdminPage
      title="المنتجات"
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <a href={exportHref}>تصدير Excel</a>
          </Button>
          <Button asChild>
            <Link href={href({ edit: "new" })}>منتج جديد</Link>
          </Button>
        </div>
      }
    >
      <AdminError message={error} />
      <form method="get" className="grid gap-3 rounded-[8px] border border-mist bg-paper-white p-4 sm:grid-cols-3">
        <input type="hidden" name="view" value={view} />
        <label className="block space-y-1 text-[14px]">
          <span className="text-graphite">الاسم</span>
          <Input name="name" defaultValue={filters.name ?? ""} />
        </label>
        <label className="block space-y-1 text-[14px]">
          <span className="text-graphite">SKU</span>
          <Input name="sku" defaultValue={filters.sku ?? ""} className="font-mono" />
        </label>
        <label className="block space-y-1 text-[14px]">
          <span className="text-graphite">الفئة</span>
          <select name="category" defaultValue={filters.categoryId ?? ""} className={fieldClass}>
            <option value="">كل الفئات</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name_ar}</option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-[14px]">
          <span className="text-graphite">العلامة</span>
          <select name="brand" defaultValue={filters.brandId ?? ""} className={fieldClass}>
            <option value="">كل العلامات</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>{brand.name}</option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-[14px]">
          <span className="text-graphite">الحالة</span>
          <select name="status" defaultValue={filters.status ?? ""} className={fieldClass}>
            <option value="">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="draft">مسودة</option>
            <option value="archived">مؤرشف</option>
          </select>
        </label>
        <label className="block space-y-1 text-[14px]">
          <span className="text-graphite">المخزون</span>
          <select name="stock" defaultValue={filters.stock ?? ""} className={fieldClass}>
            <option value="">كل المخزون</option>
            <option value="in">متوفر (أكثر من 5)</option>
            <option value="low">منخفض (1–5)</option>
            <option value="out">نافد</option>
          </select>
        </label>
        <div className="flex items-end gap-2 sm:col-span-3">
          <Button type="submit">بحث</Button>
          <Button asChild variant="outline">
            <Link href={`/admin/products?view=${view}`}>مسح</Link>
          </Button>
        </div>
      </form>

      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex rounded-[4px] border border-mist bg-paper-white p-1">
          <Link href={href({ view: "cards", edit: params.edit ?? null })} className={`inline-flex min-h-10 items-center rounded-[4px] px-3 text-[14px] font-bold tracking-[0.038em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carbon-ink ${view === "cards" ? "bg-fog text-carbon-ink" : "text-graphite"}`}>
            بطاقات
          </Link>
          <Link href={href({ view: "table", edit: params.edit ?? null })} className={`inline-flex min-h-10 items-center rounded-[4px] px-3 text-[14px] font-bold tracking-[0.038em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carbon-ink ${view === "table" ? "bg-fog text-carbon-ink" : "text-graphite"}`}>
            جدول
          </Link>
        </div>
        <p className="text-[14px] text-graphite">عدد النتائج: {products.length}</p>
      </div>

      {categories.length === 0 ? (
        <p className="text-[14px] text-graphite">أضف فئة أولاً من صفحة الفئات حتى يمكن حفظ منتج.</p>
      ) : null}

      {showForm ? (
        <section className="space-y-3 rounded-[8px] border border-mist bg-paper-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[14px] font-bold tracking-[0.038em]">{params.edit === "new" ? "منتج جديد" : "تعديل المنتج"}</h2>
            <Link href={href({ edit: null })} className="text-[14px] text-graphite">إغلاق</Link>
          </div>
          {params.edit !== "new" && !editing ? (
            <AdminEmpty>المنتج غير موجود في النتائج الحالية.</AdminEmpty>
          ) : (
            <ProductForm
              categories={categoryOptions}
              brands={brandOptions}
              product={editing}
              r2Enabled={r2Enabled}
              view={view}
            />
          )}
          {editing ? (
            <div className="flex flex-wrap gap-3 border-t border-mist pt-3">
              {editing.status !== "archived" ? <ArchiveProductForm productId={editing.id} /> : null}
              <DeleteProductForm productId={editing.id} />
            </div>
          ) : null}
        </section>
      ) : null}

      {products.length === 0 ? (
        <AdminEmpty>لا توجد منتجات مطابقة.</AdminEmpty>
      ) : view === "cards" ? (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const badge = productBadge(product.stock, product.price_piasters, product.compare_at_piasters);
            return (
              <li key={product.id} className="overflow-hidden rounded-[8px] border border-mist bg-paper-white">
                <div className="relative aspect-square bg-fog">
                  {product.image_url ? (
                    <img src={product.image_url} alt="" className="h-full w-full rounded-[8px] object-cover" />
                  ) : null}
                  {badge ? (
                    <span className="absolute top-3 right-3 rounded-full bg-paper-white px-2 py-0.5 text-[12px] text-ember-red">
                      {badge}
                    </span>
                  ) : null}
                </div>
                <div className="space-y-1 p-3 text-[14px]">
                  <p className="text-carbon-ink">{product.name_ar}</p>
                  <p className="font-mono text-graphite">{product.sku || "—"}</p>
                  <p>{formatMoney(product.price_piasters)}</p>
                  <p className="text-graphite">المخزون {product.stock}</p>
                  <StatusPill>{statusLabel[product.status]}</StatusPill>
                  <div className="flex items-center gap-3 pt-2">
                    <Link href={href({ edit: product.id })} className="font-bold tracking-[0.038em] text-carbon-ink">تعديل</Link>
                    {product.status !== "archived" ? <ArchiveProductForm productId={product.id} /> : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <AdminList columns={["الصورة", "المنتج", "SKU", "السعر", "المخزون", "الحالة", "إجراء"]} gridClass={productColumns}>
          {products.map((product) => (
            <AdminListRow key={product.id} gridClass={productColumns}>
              <AdminListCell label="الصورة">
                {product.image_url ? (
                  <img src={product.image_url} alt="" className="h-12 w-12 rounded-[8px] object-cover" />
                ) : (
                  <span className="block h-12 w-12 rounded-[8px] bg-fog" />
                )}
              </AdminListCell>
              <AdminListCell label="المنتج">
                <span className="text-carbon-ink">{product.name_ar}</span>
              </AdminListCell>
              <AdminListCell label="SKU">
                <span className="font-mono text-[14px]">{product.sku || "—"}</span>
              </AdminListCell>
              <AdminListCell label="السعر">
                <span>{formatMoney(product.price_piasters)}</span>
              </AdminListCell>
              <AdminListCell label="المخزون">
                <span>{product.stock}</span>
              </AdminListCell>
              <AdminListCell label="الحالة">
                <StatusPill>{statusLabel[product.status]}</StatusPill>
              </AdminListCell>
              <AdminListCell label="إجراء">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={href({ edit: product.id })} className="inline-flex h-10 items-center text-[14px] font-bold tracking-[0.038em] text-carbon-ink">
                    تعديل
                  </Link>
                  {product.status !== "archived" ? <ArchiveProductForm productId={product.id} /> : null}
                </div>
              </AdminListCell>
            </AdminListRow>
          ))}
        </AdminList>
      )}
    </AdminPage>
  );
}
