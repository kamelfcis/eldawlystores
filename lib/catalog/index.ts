import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/config";
import { isCatalogSuccess, runCatalogFetch } from "@/lib/catalog/fetch";
import { mockCategories, mockProducts, mockBrands, mockBanners } from "@/lib/mock-data";
import type { Database, ProductWithDetails, Category, Brand, Product, ProductVariant } from "@/lib/types/database";

export { classifyCatalogError, isRetryable, userFacingMessage } from "@/lib/catalog/errors";
export type { CatalogErrorKind } from "@/lib/catalog/errors";

export interface ProductFilters {
  categorySlug?: string;
  brandSlug?: string;
  search?: string;
  sort?: "price_asc" | "price_desc" | "newest" | "rating";
  page?: number;
  pageSize?: number;
  minPrice?: number;
  maxPrice?: number;
  availability?: "in_stock";
}

export interface PaginatedProducts {
  products: ProductWithDetails[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

type ProductImage = Database["public"]["Tables"]["product_images"]["Row"];
type PublicVariant = Omit<ProductVariant, "cost_price_piasters">;

interface ProductRow extends Product {
  brand: Brand | Brand[] | null;
  category: Category | Category[] | null;
  variants: PublicVariant[] | null;
  images: ProductImage[] | null;
}

type HomepageBanner = Database["public"]["Tables"]["homepage_banners"]["Row"];

const VARIANT_COLUMNS =
  "id, product_id, sku, price_piasters, compare_at_piasters, stock, is_default, created_at";

const PRODUCT_SELECT = `
  id, name_ar, slug, description_ar, category_id, brand_id, status, rating, created_at, updated_at,
  brand:brands(id, name, slug, logo_url, created_at),
  category:categories(id, name_ar, slug, description_ar, image_url, sort_order, created_at),
  variants:product_variants(${VARIANT_COLUMNS}),
  images:product_images(id, product_id, url, alt_text, sort_order)
`;

function catalogClient() {
  return createClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function emptyPaginated(page: number, pageSize: number): PaginatedProducts {
  return { products: [], total: 0, page, pageSize, totalPages: 0 };
}

function asOne<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapProduct(row: ProductRow): ProductWithDetails | null {
  const category = asOne(row.category);
  if (!category) return null;

  const variants: ProductVariant[] = (row.variants ?? []).map((variant) => ({
    ...variant,
    cost_price_piasters: null,
  }));
  if (variants.length === 0) return null;

  const defaultVariant = variants.find((variant) => variant.is_default) ?? variants[0];
  const images = [...(row.images ?? [])].sort((a, b) => a.sort_order - b.sort_order);

  return {
    id: row.id,
    name_ar: row.name_ar,
    slug: row.slug,
    description_ar: row.description_ar,
    category_id: row.category_id,
    brand_id: row.brand_id,
    status: row.status,
    rating: row.rating == null ? null : Number(row.rating),
    created_at: row.created_at,
    updated_at: row.updated_at,
    brand: asOne(row.brand),
    category,
    variants,
    images,
    defaultVariant,
  };
}

async function fetchActiveProducts(): Promise<ProductWithDetails[]> {
  const result = await runCatalogFetch("fetchActiveProducts", async () => {
    const { data, error } = await catalogClient()
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("status", "active")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown as ProductRow[])
      .map(mapProduct)
      .filter((product): product is ProductWithDetails => product !== null);
  });

  return isCatalogSuccess(result) ? result.data : [];
}

function filterAndPaginate(source: ProductWithDetails[], filters: ProductFilters): PaginatedProducts {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 12;
  let products = [...source];

  if (filters.categorySlug) {
    products = products.filter((p) => p.category.slug === filters.categorySlug);
  }
  if (filters.brandSlug) {
    products = products.filter((p) => p.brand?.slug === filters.brandSlug);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    products = products.filter(
      (p) => p.name_ar.includes(q) || p.slug.includes(q) || p.brand?.name.toLowerCase().includes(q)
    );
  }
  if (filters.minPrice != null) {
    products = products.filter((p) => p.defaultVariant.price_piasters >= filters.minPrice!);
  }
  if (filters.maxPrice != null) {
    products = products.filter((p) => p.defaultVariant.price_piasters <= filters.maxPrice!);
  }
  if (filters.availability === "in_stock") {
    products = products.filter((p) => p.defaultVariant.stock > 0);
  }

  switch (filters.sort) {
    case "price_asc":
      products.sort((a, b) => a.defaultVariant.price_piasters - b.defaultVariant.price_piasters);
      break;
    case "price_desc":
      products.sort((a, b) => b.defaultVariant.price_piasters - a.defaultVariant.price_piasters);
      break;
    case "rating":
      products.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      break;
    case "newest":
      products.sort((a, b) => b.created_at.localeCompare(a.created_at));
      break;
    default:
      break;
  }

  const total = products.length;
  const start = (page - 1) * pageSize;
  const paginated = products.slice(start, start + pageSize);

  return { products: paginated, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export const getCategories = cache(async function getCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured()) return mockCategories;

  const result = await runCatalogFetch("getCategories", async () => {
    const { data, error } = await catalogClient()
      .from("categories")
      .select("id, name_ar, slug, description_ar, image_url, sort_order, created_at")
      .order("sort_order");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

  return isCatalogSuccess(result) ? result.data : [];
});

export const getBrands = cache(async function getBrands(): Promise<Brand[]> {
  if (!isSupabaseConfigured()) return mockBrands;

  const result = await runCatalogFetch("getBrands", async () => {
    const { data, error } = await catalogClient()
      .from("brands")
      .select("id, name, slug, logo_url, created_at")
      .order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

  return isCatalogSuccess(result) ? result.data : [];
});

export const getBanners = cache(async function getBanners(): Promise<HomepageBanner[]> {
  if (!isSupabaseConfigured()) return mockBanners;

  const typed = await catalogClient()
    .from("homepage_banners")
    .select("id, title_ar, subtitle_ar, image_url, link_url, sort_order, is_active, type")
    .eq("is_active", true)
    .order("sort_order");

  if (!typed.error) return typed.data ?? [];

  const message = typed.error.message ?? "";
  if (/column/i.test(message) && /type/i.test(message)) {
    const legacy = await catalogClient()
      .from("homepage_banners")
      .select("id, title_ar, subtitle_ar, image_url, link_url, sort_order, is_active")
      .eq("is_active", true)
      .order("sort_order");
    if (legacy.error) return [];
    return [...(legacy.data ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id))
      .map((row, index) => ({
        ...row,
        type: index === 0 ? ("hero" as const) : ("offer" as const),
      }));
  }

  const failed = await runCatalogFetch("getBanners", async () => {
    throw new Error(message);
  });
  return isCatalogSuccess(failed) ? failed.data : [];
});

function arabicSearchFilter(raw: string): string | null {
  const q = raw.trim().replace(/[,.():*\\"]/g, "").slice(0, 80);
  if (!q) return null;
  return `search_vector.plfts(arabic).${q},and(search_vector.is.null,name_ar.ilike.*${q}*)`;
}

interface LooseQuery {
  eq(column: string, value: string | number | boolean): LooseQuery;
  gte(column: string, value: number): LooseQuery;
  lte(column: string, value: number): LooseQuery;
  gt(column: string, value: number): LooseQuery;
  or(filters: string): LooseQuery;
  order(
    column: string,
    options?: { ascending?: boolean; nullsFirst?: boolean; referencedTable?: string }
  ): LooseQuery;
  range(
    from: number,
    to: number
  ): PromiseLike<{ data: unknown; error: { message: string } | null; count: number | null }>;
}

async function fetchFilteredProducts(filters: ProductFilters): Promise<PaginatedProducts> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 12;

  const result = await runCatalogFetch("getProducts", async () => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const filterVariants =
      filters.minPrice != null ||
      filters.maxPrice != null ||
      filters.availability === "in_stock" ||
      filters.sort === "price_asc" ||
      filters.sort === "price_desc";

    const select = `
      id, name_ar, slug, description_ar, category_id, brand_id, status, rating, created_at, updated_at,
      brand:brands${filters.brandSlug ? "!inner" : ""}(id, name, slug, logo_url, created_at),
      category:categories${filters.categorySlug ? "!inner" : ""}(id, name_ar, slug, description_ar, image_url, sort_order, created_at),
      variants:product_variants${filterVariants ? "!inner" : ""}(${VARIANT_COLUMNS}),
      images:product_images(id, product_id, url, alt_text, sort_order)
    `;

    let query = catalogClient()
      .from("products")
      .select(select, { count: "exact" })
      .eq("status", "active") as unknown as LooseQuery;

    if (filters.categorySlug) query = query.eq("category.slug", filters.categorySlug);
    if (filters.brandSlug) query = query.eq("brand.slug", filters.brandSlug);
    if (filterVariants) query = query.eq("variants.is_default", true);
    if (filters.minPrice != null) query = query.gte("variants.price_piasters", filters.minPrice);
    if (filters.maxPrice != null) query = query.lte("variants.price_piasters", filters.maxPrice);
    if (filters.availability === "in_stock") query = query.gt("variants.stock", 0);

    const search = filters.search ? arabicSearchFilter(filters.search) : null;
    if (search) query = query.or(search);

    switch (filters.sort) {
      case "price_asc":
        query = query.order("price_piasters", { referencedTable: "variants", ascending: true });
        break;
      case "price_desc":
        query = query.order("price_piasters", { referencedTable: "variants", ascending: false });
        break;
      case "rating":
        query = query.order("rating", { ascending: false, nullsFirst: false });
        break;
      case "newest":
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    const { data, error, count } = await query.range(from, to);
    if (error) throw new Error(error.message);

    const products = ((data ?? []) as ProductRow[])
      .map(mapProduct)
      .filter((product): product is ProductWithDetails => product !== null);
    const total = count ?? products.length;

    return {
      products,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  });

  return isCatalogSuccess(result) ? result.data : emptyPaginated(page, pageSize);
}

function catalogFiltersKey(filters: ProductFilters): string {
  return JSON.stringify({
    categorySlug: filters.categorySlug ?? "",
    brandSlug: filters.brandSlug ?? "",
    search: filters.search ?? "",
    sort: filters.sort ?? "",
    page: filters.page ?? 1,
    pageSize: filters.pageSize ?? 12,
    minPrice: filters.minPrice ?? null,
    maxPrice: filters.maxPrice ?? null,
    availability: filters.availability ?? "",
  });
}

const loadProducts = cache(async (key: string): Promise<PaginatedProducts> => {
  const filters = JSON.parse(key) as ProductFilters;
  if (!isSupabaseConfigured()) return filterAndPaginate(mockProducts, filters);
  return fetchFilteredProducts(filters);
});

export function getProducts(filters: ProductFilters = {}): Promise<PaginatedProducts> {
  return loadProducts(catalogFiltersKey(filters));
}

export const getProductBySlug = cache(async function getProductBySlug(
  slug: string
): Promise<ProductWithDetails | null> {
  if (!isSupabaseConfigured()) {
    return mockProducts.find((p) => p.slug === slug) ?? null;
  }

  const result = await runCatalogFetch("getProductBySlug", async () => {
    const { data, error } = await catalogClient()
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("slug", slug)
      .eq("status", "active")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return mapProduct(data as unknown as ProductRow);
  });

  return isCatalogSuccess(result) ? result.data : null;
});

export async function getCategoryProductRails(): Promise<Array<{ category: Category; products: ProductWithDetails[] }>> {
  const categories = await getCategories();
  const rails = await Promise.all(
    categories.map(async (category) => {
      const page = await getProducts({ categorySlug: category.slug, page: 1, pageSize: 12, sort: "newest" });
      return { category, products: page.products };
    })
  );
  return rails.filter((rail) => rail.products.length > 0);
}

export async function getFeaturedProducts(limit = 4): Promise<ProductWithDetails[]> {
  if (!isSupabaseConfigured()) return mockProducts.slice(0, limit);
  const { products } = await getProducts({ page: 1, pageSize: limit, sort: "newest" });
  return products;
}

export async function getRelatedProducts(productId: string, limit = 4): Promise<ProductWithDetails[]> {
  const source = isSupabaseConfigured() ? await fetchActiveProducts() : mockProducts;
  const product = source.find((p) => p.id === productId);
  if (!product) return [];
  return source.filter((p) => p.category_id === product.category_id && p.id !== productId).slice(0, limit);
}

export async function getProductsByIds(ids: string[]): Promise<ProductWithDetails[]> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return [];

  if (!isSupabaseConfigured()) {
    const byId = new Map(mockProducts.map((product) => [product.id, product]));
    return unique.map((id) => byId.get(id)).filter((product): product is ProductWithDetails => product != null);
  }

  const result = await runCatalogFetch("getProductsByIds", async () => {
    const { data, error } = await catalogClient()
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("status", "active")
      .in("id", unique);
    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown as ProductRow[])
      .map(mapProduct)
      .filter((product): product is ProductWithDetails => product !== null);
  });

  if (!isCatalogSuccess(result)) return [];

  const byId = new Map(result.data.map((product) => [product.id, product]));
  return unique.map((id) => byId.get(id)).filter((product): product is ProductWithDetails => product != null);
}

export const getCategoryBySlug = cache(async function getCategoryBySlug(slug: string): Promise<Category | null> {
  if (!isSupabaseConfigured()) return mockCategories.find((c) => c.slug === slug) ?? null;

  const result = await runCatalogFetch("getCategoryBySlug", async () => {
    const { data, error } = await catalogClient()
      .from("categories")
      .select("id, name_ar, slug, description_ar, image_url, sort_order, created_at")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

  return isCatalogSuccess(result) ? result.data : null;
});
