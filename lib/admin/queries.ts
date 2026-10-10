import { arabicDbError } from "@/lib/admin/errors";
import { assertAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  ADMIN_NOTIFICATION_EMAILS_KEY,
  readAdminNotificationEmailsSetting,
  type AdminNotificationEmailsSetting,
} from "@/lib/admin/notification-emails";
import { parseStorefrontBranding, STOREFRONT_BRANDING_KEY } from "@/lib/store-branding";
import { readWhatsappValue } from "@/lib/store-settings";
import type { Database, ProductStatus } from "@/lib/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

export interface AdminProductImage {
  id: string;
  url: string;
  sort_order: number;
}

export interface AdminProductRow {
  id: string;
  name_ar: string;
  slug: string;
  description_ar: string | null;
  category_id: string;
  brand_id: string | null;
  status: ProductStatus;
  variantId: string;
  sku: string;
  price_piasters: number;
  compare_at_piasters: number | null;
  stock: number;
  imageId: string;
  image_url: string;
  images: AdminProductImage[];
}

export type AdminStockFilter = "in" | "low" | "out";

export interface AdminCatalogFilters {
  name?: string;
  sku?: string;
  categoryId?: string;
  brandId?: string;
  status?: ProductStatus;
  stock?: AdminStockFilter;
}

const productSelect =
  "id, name_ar, slug, description_ar, category_id, brand_id, status, created_at, variants:product_variants(id, sku, price_piasters, compare_at_piasters, stock, is_default), images:product_images(id, url, sort_order)";

function escapeIlike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function parseAdminCatalogFilters(input: {
  name?: string | null;
  sku?: string | null;
  category?: string | null;
  brand?: string | null;
  status?: string | null;
  stock?: string | null;
}): AdminCatalogFilters {
  const name = input.name?.trim() ?? "";
  const sku = input.sku?.trim() ?? "";
  const category = input.category?.trim() ?? "";
  const brand = input.brand?.trim() ?? "";
  const status = input.status?.trim() ?? "";
  const stock = input.stock?.trim() ?? "";

  return {
    name: name || undefined,
    sku: sku || undefined,
    categoryId: isUuid(category) ? category : undefined,
    brandId: isUuid(brand) ? brand : undefined,
    status: status === "draft" || status === "active" || status === "archived" ? status : undefined,
    stock: stock === "in" || stock === "low" || stock === "out" ? stock : undefined,
  };
}

export function adminProductExportQuery(filters: AdminCatalogFilters): string {
  const params = new URLSearchParams({ resource: "products" });
  if (filters.name) params.set("name", filters.name);
  if (filters.sku) params.set("sku", filters.sku);
  if (filters.categoryId) params.set("category", filters.categoryId);
  if (filters.brandId) params.set("brand", filters.brandId);
  if (filters.status) params.set("status", filters.status);
  if (filters.stock) params.set("stock", filters.stock);
  return params.toString();
}

async function findDefaultVariantProductIds(
  supabase: SupabaseClient<Database>,
  filters: AdminCatalogFilters
): Promise<{ ids: string[] | null; error: string | null }> {
  if (!filters.sku && !filters.stock) return { ids: null, error: null };

  const pageSize = 1000;
  const ids: string[] = [];
  let from = 0;

  while (from <= 100_000) {
    let query = supabase
      .from("product_variants")
      .select("product_id")
      .eq("is_default", true)
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);

    if (filters.sku) query = query.ilike("sku", `%${escapeIlike(filters.sku)}%`);
    if (filters.stock === "out") query = query.eq("stock", 0);
    else if (filters.stock === "low") query = query.gt("stock", 0).lte("stock", 5);
    else if (filters.stock === "in") query = query.gt("stock", 5);

    const { data, error } = await query;
    if (error) return { ids: null, error: arabicDbError(error) ?? "تعذر إكمال العملية" };
    const batch = data ?? [];
    for (const row of batch) ids.push(row.product_id);
    if (batch.length < pageSize) return { ids: [...new Set(ids)], error: null };
    from += pageSize;
  }

  return { ids: null, error: "تعذر إكمال تصفية المنتجات" };
}

export async function getAdminCatalog(filters: AdminCatalogFilters = {}) {
  await assertAdmin();
  const supabase = await createClient();

  const [categoriesResult, brandsResult, variantMatch] = await Promise.all([
    supabase.from("categories").select("id, name_ar, slug, description_ar, image_url, sort_order").order("sort_order"),
    supabase.from("brands").select("id, name, slug, logo_url").order("name"),
    findDefaultVariantProductIds(supabase, filters),
  ]);

  const catalogError = arabicDbError(categoriesResult.error) ?? arabicDbError(brandsResult.error);

  if (variantMatch.error || (variantMatch.ids && variantMatch.ids.length === 0)) {
    return {
      products: [] as AdminProductRow[],
      categories: categoriesResult.data ?? [],
      brands: brandsResult.data ?? [],
      error: variantMatch.error ?? catalogError,
    };
  }

  const idChunks: Array<string[] | null> = variantMatch.ids
    ? Array.from({ length: Math.ceil(variantMatch.ids.length / 100) }, (_, index) =>
        variantMatch.ids!.slice(index * 100, index * 100 + 100)
      )
    : [null];

  const productResults = await Promise.all(
    idChunks.map((ids) => {
      let query = supabase
        .from("products")
        .select(productSelect)
        .order("created_at", { ascending: false });
      if (filters.name) query = query.ilike("name_ar", `%${escapeIlike(filters.name)}%`);
      if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
      if (filters.brandId) query = query.eq("brand_id", filters.brandId);
      if (filters.status) query = query.eq("status", filters.status);
      if (ids) query = query.in("id", ids);
      return query;
    })
  );

  const productsResultError = arabicDbError(productResults.find((result) => result.error)?.error ?? null);
  const productsResult = {
    data: productsResultError
      ? []
      : productResults
          .flatMap((result) => result.data ?? [])
          .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))),
    error: productsResultError ? { message: productsResultError } : null,
  };

  const products = ((productsResult.data ?? []) as unknown as Array<{
    id: string;
    name_ar: string;
    slug: string;
    description_ar: string | null;
    category_id: string;
    brand_id: string | null;
    status: ProductStatus;
    variants: Array<{
      id: string;
      sku: string;
      price_piasters: number;
      compare_at_piasters: number | null;
      stock: number;
      is_default: boolean;
    }> | null;
    images: Array<{ id: string; url: string; sort_order: number }> | null;
  }>).map((product) => {
    const variants = asArray(product.variants);
    const variant = variants.find((item) => item.is_default) ?? variants[0];
    const images = [...asArray(product.images)]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((image) => ({ id: image.id, url: image.url, sort_order: image.sort_order }));
    return {
      id: product.id,
      name_ar: product.name_ar,
      slug: product.slug,
      description_ar: product.description_ar,
      category_id: product.category_id,
      brand_id: product.brand_id,
      status: product.status,
      variantId: variant?.id ?? "",
      sku: variant?.sku ?? "",
      price_piasters: variant?.price_piasters ?? 0,
      compare_at_piasters: variant?.compare_at_piasters ?? null,
      stock: variant?.stock ?? 0,
      imageId: images[0]?.id ?? "",
      image_url: images[0]?.url ?? "",
      images,
    } satisfies AdminProductRow;
  });

  return {
    products,
    categories: categoriesResult.data ?? [],
    brands: brandsResult.data ?? [],
    error: arabicDbError(productsResult.error) ?? arabicDbError(categoriesResult.error) ?? arabicDbError(brandsResult.error),
  };
}

export async function getLowStock(limit = 20) {
  await assertAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_variants")
    .select("id, sku, stock, product_id, products(id, name_ar)")
    .lte("stock", 5)
    .order("stock", { ascending: true })
    .limit(limit);

  const { count, error: countError } = await supabase
    .from("product_variants")
    .select("id", { count: "exact", head: true })
    .lte("stock", 5);

  if (error) return { items: [], count: 0, error: arabicDbError(error) };

  const items = ((data ?? []) as unknown as Array<{
    id: string;
    sku: string;
    stock: number;
    product_id: string;
    products: { id: string; name_ar: string } | { id: string; name_ar: string }[] | null;
  }>).map((row) => {
    const product = Array.isArray(row.products) ? row.products[0] : row.products;
    return {
      id: row.id,
      productId: row.product_id || product?.id || "",
      sku: row.sku,
      stock: row.stock,
      product: product?.name_ar ?? "منتج",
    };
  });

  return {
    items,
    count: countError ? items.length : (count ?? 0),
    error: arabicDbError(countError),
  };
}

export interface AdminPromotionRow {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_piasters: number;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
}

export async function getAdminPromotions() {
  await assertAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("promotions")
    .select("id, code, discount_type, discount_value, min_order_piasters, max_uses, used_count, is_active, expires_at")
    .order("created_at", { ascending: false });

  const promotions = ((data ?? []) as AdminPromotionRow[]).filter(
    (row) => row.discount_type === "percentage" || row.discount_type === "fixed"
  );

  return { promotions, error: arabicDbError(error) };
}

export async function getAdminBanners() {
  await assertAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("homepage_banners")
    .select("id, title_ar, subtitle_ar, link_url, image_url, sort_order, is_active, type")
    .order("sort_order");
  return { banners: data ?? [], error: arabicDbError(error) };
}

export interface AdminShippingRate {
  id: string;
  governorate: string;
  rate_piasters: number;
}

export async function getAdminSettings() {
  await assertAdmin();
  const supabase = await createClient();
  const [settingsResult, ratesResult] = await Promise.all([
    supabase
      .from("settings")
      .select("key, value")
      .in("key", ["whatsapp_number", STOREFRONT_BRANDING_KEY, ADMIN_NOTIFICATION_EMAILS_KEY]),
    supabase.from("shipping_rates").select("id, governorate, rate_piasters").order("governorate"),
  ]);

  const rows = settingsResult.data ?? [];
  const whatsappRow = rows.find((row) => row.key === "whatsapp_number");
  const brandingRow = rows.find((row) => row.key === STOREFRONT_BRANDING_KEY);
  const notificationRow = rows.find((row) => row.key === ADMIN_NOTIFICATION_EMAILS_KEY);
  const adminNotificationEmails: AdminNotificationEmailsSetting = settingsResult.error
    ? { kind: "unavailable" }
    : readAdminNotificationEmailsSetting(notificationRow);

  return {
    whatsapp: readWhatsappValue(whatsappRow?.value),
    branding: parseStorefrontBranding(brandingRow?.value),
    adminNotificationEmails,
    rates: (ratesResult.data ?? []) as AdminShippingRate[],
    error: arabicDbError(settingsResult.error) ?? arabicDbError(ratesResult.error),
  };
}
