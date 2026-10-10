"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-provider";
import {
  planReorder,
  REORDER_NONE_NOTICE,
  REORDER_NOTICE_STORAGE_KEY,
  REORDER_PARTIAL_NOTICE,
  type ReorderVariant,
} from "@/lib/account/reorder";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { ProductStatus } from "@/lib/types/database";
import { cn } from "@/lib/utils/cn";

const REORDER_ERROR = "تعذر إعادة الطلب";

interface ReorderButtonProps {
  orderId: string;
  className?: string;
}

type ProductImageRow = { url: string; sort_order: number };

type VariantRow = {
  id: string;
  sku: string;
  price_piasters: number;
  compare_at_piasters: number | null;
  stock: number;
  product: {
    id: string;
    name_ar: string;
    slug: string;
    status: ProductStatus;
    images: ProductImageRow[] | ProductImageRow | null;
  } | null;
};

function normalizeImages(images: ProductImageRow[] | ProductImageRow | null | undefined): ProductImageRow[] {
  if (!images) return [];
  return Array.isArray(images) ? images : [images];
}

export function ReorderButton({ orderId, className }: ReorderButtonProps) {
  const { addToCart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  async function handleReorder() {
    setNotice("");
    if (!isSupabaseConfigured()) {
      setNotice(REORDER_ERROR);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: lines, error: linesError } = await supabase
        .from("order_items")
        .select("variant_id, quantity")
        .eq("order_id", orderId);

      if (linesError || !lines?.length) {
        setNotice(REORDER_NONE_NOTICE);
        return;
      }

      const variantIds = [...new Set(lines.map((line) => line.variant_id))];
      const { data: variants, error: variantsError } = await supabase
        .from("product_variants")
        .select(
          "id, sku, price_piasters, compare_at_piasters, stock, product:products(id, name_ar, slug, status, images:product_images(url, sort_order))"
        )
        .in("id", variantIds);

      if (variantsError) {
        setNotice(REORDER_ERROR);
        return;
      }

      const variantsById = new Map<string, ReorderVariant>();
      for (const row of (variants ?? []) as VariantRow[]) {
        const sorted = normalizeImages(row.product?.images).sort((a, b) => a.sort_order - b.sort_order);
        variantsById.set(row.id, {
          id: row.id,
          sku: row.sku,
          pricePiasters: row.price_piasters,
          compareAtPiasters: row.compare_at_piasters,
          stock: row.stock,
          product: row.product
            ? {
                id: row.product.id,
                nameAr: row.product.name_ar,
                slug: row.product.slug,
                status: row.product.status,
                imageUrl: sorted[0]?.url ?? "/placeholder-product.svg",
              }
            : null,
        });
      }

      const plan = planReorder(
        lines.map((line) => ({ variantId: line.variant_id, quantity: line.quantity })),
        variantsById
      );

      if (plan.addable.length === 0) {
        setNotice(REORDER_NONE_NOTICE);
        return;
      }

      for (const entry of plan.addable) {
        addToCart(entry.item, entry.quantity);
      }

      if (plan.skipped.length > 0) {
        sessionStorage.setItem(REORDER_NOTICE_STORAGE_KEY, REORDER_PARTIAL_NOTICE);
      } else {
        sessionStorage.removeItem(REORDER_NOTICE_STORAGE_KEY);
      }

      router.push("/cart");
    } catch {
      setNotice(REORDER_ERROR);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Button
        type="button"
        variant="retail"
        className="h-10 min-h-10 w-full sm:w-auto"
        disabled={loading}
        onClick={() => void handleReorder()}
      >
        {loading ? "جاري الإضافة..." : "إعادة الطلب"}
      </Button>
      {notice ? <p className="text-[13px] text-graphite">{notice}</p> : null}
    </div>
  );
}
