"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-provider";
import type { ProductWithDetails, ProductVariant } from "@/lib/types/database";

interface AddToCartButtonProps {
  product: ProductWithDetails;
  variant: ProductVariant;
}

export function AddToCartButton({ product, variant }: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  if (variant.stock <= 0) {
    return (
      <Button variant="retail" disabled className="w-full sm:w-auto">
        نفذت الكمية
      </Button>
    );
  }

  return (
    <Button
      variant="retail"
      className="w-full sm:w-auto"
      onClick={() => {
        addToCart({
          variantId: variant.id,
          productId: product.id,
          productName: product.name_ar,
          productSlug: product.slug,
          variantSku: variant.sku,
          unitPricePiasters: variant.price_piasters,
          compareAtPiasters: variant.compare_at_piasters,
          imageUrl: product.images[0]?.url ?? "/placeholder-product.svg",
          stock: variant.stock,
        });
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      }}
      >
        <span className="grid">
          <span className="col-start-1 row-start-1" aria-hidden={added}>
            أضف إلى السلة
          </span>
          <span className="col-start-1 row-start-1" role="status" aria-hidden={!added} style={{ visibility: added ? "visible" : "hidden" }}>
            تمت الإضافة ✓
          </span>
        </span>
      </Button>
  );
}
