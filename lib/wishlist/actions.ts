"use server";

import { getProductsByIds } from "@/lib/catalog";
import type { ProductWithDetails } from "@/lib/types/database";

export async function loadWishlistProducts(ids: string[]): Promise<ProductWithDetails[]> {
  return getProductsByIds(ids);
}
