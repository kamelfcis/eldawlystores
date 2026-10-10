import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveEmailImageUrl } from "@/lib/email";
import type { Database } from "@/lib/types/database";

export const PLACEHOLDER_PRODUCT_IMAGE = "/placeholder-product.svg";

/** Absolute https URLs pass through; bare storage keys use getPublicUrl; relative paths → placeholder. */
export function resolveOrderItemImageUrl(stored: string | null | undefined): string {
  return resolveEmailImageUrl(stored) ?? PLACEHOLDER_PRODUCT_IMAGE;
}

/** Batch-resolve variant_id → first product image url (raw DB value, lowest sort_order). */
export async function fetchVariantProductImageUrls(
  supabase: SupabaseClient<Database>,
  variantIds: string[]
): Promise<Map<string, string>> {
  const images = new Map<string, string>();
  const ids = [...new Set(variantIds.filter((id) => id.length > 0))];
  if (ids.length === 0) return images;

  const { data: variants, error: variantsError } = await supabase
    .from("product_variants")
    .select("id, product_id")
    .in("id", ids);
  if (variantsError || !variants?.length) return images;

  const productIds = [...new Set(variants.map((variant) => variant.product_id))];
  const { data: productImages, error: imagesError } = await supabase
    .from("product_images")
    .select("product_id, url, sort_order")
    .in("product_id", productIds)
    .order("sort_order", { ascending: true });
  if (imagesError || !productImages) return images;

  const firstByProduct = new Map<string, string>();
  for (const image of productImages) {
    if (firstByProduct.has(image.product_id)) continue;
    firstByProduct.set(image.product_id, image.url);
  }

  for (const variant of variants) {
    const url = firstByProduct.get(variant.product_id);
    if (url) images.set(variant.id, url);
  }

  return images;
}

/** Resolved storefront URLs for order line items (placeholder when variant/image missing). */
export async function loadOrderItemImageUrls(
  supabase: SupabaseClient<Database>,
  variantIds: string[]
): Promise<Map<string, string>> {
  const raw = await fetchVariantProductImageUrls(supabase, variantIds);
  const resolved = new Map<string, string>();
  for (const [variantId, url] of raw) {
    resolved.set(variantId, resolveOrderItemImageUrl(url));
  }
  return resolved;
}
