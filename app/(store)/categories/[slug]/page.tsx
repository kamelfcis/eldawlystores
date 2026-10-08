import { notFound } from "next/navigation";
import { getCategoryBySlug, getProducts, getCategories, getCategoryBrandMap } from "@/lib/catalog";
import { poundsToPiasters } from "@/lib/money";
import { ProductGrid } from "@/components/product/product-grid";
import { CategoryPills } from "@/components/layout/category-pills";
import { ProductFilters } from "@/components/product/product-filters";
import { Breadcrumb } from "@/components/layout/breadcrumb";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    page?: string;
    sort?: string;
    brand?: string;
    min?: string;
    max?: string;
    availability?: string;
  }>;
}

const SORTS = ["price_asc", "price_desc", "newest", "rating"] as const;
type Sort = (typeof SORTS)[number];

function parseSort(value?: string): Sort | undefined {
  if (value && (SORTS as readonly string[]).includes(value)) return value as Sort;
  return undefined;
}

function poundsParamToPiasters(value?: string): number | undefined {
  if (!value || !/^\d+(\.\d+)?$/.test(value)) return undefined;
  const pounds = Number(value);
  if (!Number.isFinite(pounds)) return undefined;
  return poundsToPiasters(pounds);
}

export async function generateMetadata({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "فئة غير موجودة" };
  const brands = (await getCategoryBrandMap())[category.id] ?? [];
  const brand = brands.find((item) => item.slug === sp.brand);
  return { title: brand ? `${category.name_ar} ${brand.name}` : category.name_ar };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const page = Number(sp.page) || 1;
  const sort = parseSort(sp.sort);

  const brandMap = await getCategoryBrandMap();
  const categoryBrands = brandMap[category.id] ?? [];
  const activeBrand = categoryBrands.find((item) => item.slug === sp.brand) ?? null;
  const title = activeBrand ? `${category.name_ar} ${activeBrand.name}` : category.name_ar;

  const [result, categories] = await Promise.all([
    getProducts({
      categorySlug: slug,
      brandSlug: activeBrand?.slug,
      sort,
      page,
      minPrice: poundsParamToPiasters(sp.min),
      maxPrice: poundsParamToPiasters(sp.max),
      availability: sp.availability === "in_stock" ? "in_stock" : undefined,
    }),
    getCategories(),
  ]);

  function pageHref(pageNum: number) {
    const query = new URLSearchParams();
    if (sp.sort) query.set("sort", sp.sort);
    if (activeBrand) query.set("brand", activeBrand.slug);
    if (sp.min) query.set("min", sp.min);
    if (sp.max) query.set("max", sp.max);
    if (sp.availability) query.set("availability", sp.availability);
    query.set("page", String(pageNum));
    return `/categories/${slug}?${query.toString()}`;
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "الرئيسية", href: "/" },
          { label: category.name_ar, href: activeBrand ? `/categories/${slug}` : undefined },
          ...(activeBrand ? [{ label: activeBrand.name }] : []),
        ]}
      />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-retail-ink">{title}</h1>
          <p className="mt-1 text-[14px] text-retail-muted">{result.total} منتج</p>
          {category.description_ar && !activeBrand ? (
            <p className="mt-1 text-graphite">{category.description_ar}</p>
          ) : null}
        </div>
      </div>
      <CategoryPills categories={categories} activeSlug={slug} />
      <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-8">
        <ProductFilters
          brands={categoryBrands}
          basePath={`/categories/${slug}`}
          layout="sidebar"
          currentSort={sp.sort}
          currentBrand={activeBrand?.slug}
          currentMin={sp.min}
          currentMax={sp.max}
          currentAvailability={sp.availability}
        />
        <div className="min-w-0">
      {result.products.length === 0 ? (
        <div className="py-16 text-center text-graphite">
          <p className="text-[16px]">لا توجد منتجات</p>
          <a href={`/categories/${slug}`} className="mt-3 inline-block text-[14px] font-bold text-retail-ink">
            مسح الفلاتر
          </a>
        </div>
      ) : (
        <ProductGrid products={result.products} />
      )}
      {result.totalPages > 1 ? (
        <div className="flex justify-center gap-2 pt-4">
          {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={pageHref(p)}
              className={`rounded-[4px] border px-3 py-1 text-sm ${
                p === page ? "border-carbon-ink bg-carbon-ink text-white" : "border-mist"
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      ) : null}
        </div>
      </div>
    </div>
  );
}
