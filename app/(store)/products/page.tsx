import { getProducts, getCategories, getBrands } from "@/lib/catalog";
import { poundsToPiasters } from "@/lib/money";
import { ProductGrid } from "@/components/product/product-grid";
import { CategoryRail } from "@/components/home/category-rail";
import { ProductFilters } from "@/components/product/product-filters";

interface ProductsPageProps {
  searchParams: Promise<{
    search?: string;
    sort?: string;
    page?: string;
    brand?: string;
    min?: string;
    max?: string;
    availability?: string;
  }>;
}

const SORTS = ["price_asc", "price_desc", "newest", "rating"] as const;
type Sort = (typeof SORTS)[number];

export const metadata = { title: "كل المنتجات" };

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

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const sort = parseSort(params.sort);

  const [result, categories, brands] = await Promise.all([
    getProducts({
      search: params.search,
      brandSlug: params.brand,
      sort,
      page,
      minPrice: poundsParamToPiasters(params.min),
      maxPrice: poundsParamToPiasters(params.max),
      availability: params.availability === "in_stock" ? "in_stock" : undefined,
    }),
    getCategories(),
    getBrands(),
  ]);

  function pageHref(pageNum: number) {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.sort) query.set("sort", params.sort);
    if (params.brand) query.set("brand", params.brand);
    if (params.min) query.set("min", params.min);
    if (params.max) query.set("max", params.max);
    if (params.availability) query.set("availability", params.availability);
    query.set("page", String(pageNum));
    return `/products?${query.toString()}`;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">كل المنتجات</h1>
      <section aria-label="تسوق حسب القسم">
        <h2 className="mb-2 text-[16px] font-bold tracking-[0.038em] text-retail-ink">تسوق حسب القسم</h2>
        <CategoryRail categories={categories} showAll />
      </section>
      <ProductFilters
        brands={brands}
        currentSort={params.sort}
        currentBrand={params.brand}
        currentMin={params.min}
        currentMax={params.max}
        currentAvailability={params.availability}
      />
      <ProductGrid products={result.products} />
      {result.totalPages > 1 && (
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
      )}
    </div>
  );
}
