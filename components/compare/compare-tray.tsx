"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { useCompare, comparePageHref } from "@/components/compare/compare-provider";
import { Button } from "@/components/ui/button";
import { loadCompareProducts } from "@/lib/compare/actions";
import { useEffect, useState } from "react";
import type { ProductWithDetails } from "@/lib/types/database";

export function CompareTray() {
  const { ids, remove, ready } = useCompare();
  const [products, setProducts] = useState<ProductWithDetails[]>([]);

  useEffect(() => {
    if (!ready || ids.length === 0) {
      setProducts([]);
      return;
    }
    let active = true;
    void loadCompareProducts(ids).then((result) => {
      if (active) setProducts(result);
    });
    return () => {
      active = false;
    };
  }, [ids, ready]);

  if (!ready || ids.length === 0) return null;

  const byId = new Map(products.map((product) => [product.id, product]));

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-retail-line bg-paper-white shadow-[0_-8px_24px_rgb(26_33_30/0.06)]"
      role="region"
      aria-label="سلة المقارنة"
    >
      <div className="mx-auto flex w-full max-w-[1440px] min-w-0 items-center gap-3 px-4 py-3">
        <p className="hidden shrink-0 text-[14px] font-bold text-retail-ink sm:block">
          المقارنة ({ids.length}/{3})
        </p>
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
          {ids.map((id) => {
            const product = byId.get(id);
            const imageUrl = product?.images[0]?.url ?? "/placeholder-product.svg";
            const name = product?.name_ar ?? "…";
            return (
              <div
                key={id}
                className="flex shrink-0 items-center gap-2 rounded-[8px] border border-retail-line bg-retail-canvas pe-2"
              >
                <div className="relative size-12 overflow-hidden rounded-[8px] bg-[#f3f3f3]">
                  <Image src={imageUrl} alt="" fill sizes="48px" className="object-contain" />
                </div>
                <span className="max-w-[120px] truncate text-[14px] text-retail-ink">{name}</span>
                <button
                  type="button"
                  aria-label={`إزالة ${name} من المقارنة`}
                  className="rounded-[4px] p-1 text-retail-muted hover:text-retail-ink"
                  onClick={() => remove(id)}
                >
                  <X className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                </button>
              </div>
            );
          })}
        </div>
        <Button asChild variant="retail" size="sm" className="shrink-0">
          <Link href={comparePageHref(ids)}>قارن الآن</Link>
        </Button>
      </div>
    </div>
  );
}
