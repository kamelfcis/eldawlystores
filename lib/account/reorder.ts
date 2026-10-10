import type { CartItem } from "@/lib/cart/types";
import type { ProductStatus } from "@/lib/types/database";

export interface ReorderLine {
  variantId: string;
  quantity: number;
}

export interface ReorderProduct {
  id: string;
  nameAr: string;
  slug: string;
  status: ProductStatus;
  imageUrl: string;
}

export interface ReorderVariant {
  id: string;
  sku: string;
  pricePiasters: number;
  compareAtPiasters: number | null;
  stock: number;
  product: ReorderProduct | null;
}

export interface ReorderSkip {
  variantId: string;
  reason: string;
}

export interface ReorderAddable {
  item: Omit<CartItem, "quantity">;
  quantity: number;
}

export interface ReorderPlan {
  addable: ReorderAddable[];
  skipped: ReorderSkip[];
}

export const REORDER_SKIP_MISSING = "المنتج غير متوفر";
export const REORDER_SKIP_INACTIVE = "المنتج غير متاح حالياً";
export const REORDER_SKIP_OUT_OF_STOCK = "نفذت الكمية";

export const REORDER_NOTICE_STORAGE_KEY = "doly-reorder-notice";
export const REORDER_PARTIAL_NOTICE = "أُضيف المتوفر. بعض المنتجات غير متاحة الآن.";
export const REORDER_NONE_NOTICE = "لا يمكن إعادة الطلب. المنتجات غير متوفرة.";

export function planReorder(
  lines: ReorderLine[],
  variantsById: Map<string, ReorderVariant>
): ReorderPlan {
  const addable: ReorderAddable[] = [];
  const skipped: ReorderSkip[] = [];

  for (const line of lines) {
    const variant = variantsById.get(line.variantId);
    if (!variant) {
      skipped.push({ variantId: line.variantId, reason: REORDER_SKIP_MISSING });
      continue;
    }

    const product = variant.product;
    if (!product) {
      skipped.push({ variantId: line.variantId, reason: REORDER_SKIP_MISSING });
      continue;
    }

    if (product.status !== "active") {
      skipped.push({ variantId: line.variantId, reason: REORDER_SKIP_INACTIVE });
      continue;
    }

    if (variant.stock <= 0) {
      skipped.push({ variantId: line.variantId, reason: REORDER_SKIP_OUT_OF_STOCK });
      continue;
    }

    const quantity = Math.min(Math.max(line.quantity, 1), variant.stock);
    addable.push({
      quantity,
      item: {
        variantId: variant.id,
        productId: product.id,
        productName: product.nameAr,
        productSlug: product.slug,
        variantSku: variant.sku,
        unitPricePiasters: variant.pricePiasters,
        compareAtPiasters: variant.compareAtPiasters,
        imageUrl: product.imageUrl,
        stock: variant.stock,
      },
    });
  }

  return { addable, skipped };
}
