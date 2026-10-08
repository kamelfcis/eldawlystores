"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useWishlist } from "@/components/wishlist/wishlist-provider";
import { ProductGrid } from "@/components/product/product-grid";
import { Button } from "@/components/ui/button";
import { loadWishlistProducts } from "@/lib/wishlist/actions";
import type { ProductWithDetails } from "@/lib/types/database";

export function WishlistView() {
  const { ids } = useWishlist();
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const shown = useRef(false);

  useEffect(() => {
    let active = true;
    if (ids.length === 0) {
      shown.current = false;
      setProducts([]);
      setLoading(false);
      return;
    }

    if (!shown.current) setLoading(true);
    void loadWishlistProducts(ids)
      .then((result) => {
        if (!active) return;
        setProducts(result);
        shown.current = true;
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [ids]);

  if (loading && products.length === 0) {
    return <p className="py-16 text-center text-[16px] text-graphite" role="status">جاري التحميل…</p>;
  }

  if (ids.length === 0 || products.length === 0) {
    return (
      <div className="space-y-4 py-16 text-center">
        <p className="text-lg text-graphite">قائمة المفضلة فارغة</p>
        <p className="text-[14px] text-graphite">احفظ المنتجات التي تعجبك لتجدها هنا لاحقاً</p>
        <Button asChild>
          <Link href="/products">تسوق الآن</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" aria-busy={loading}>
      <h1 className="text-2xl font-bold text-retail-ink">المفضلة</h1>
      <ProductGrid products={products} />
    </div>
  );
}
