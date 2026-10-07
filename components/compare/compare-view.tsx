"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { useCompare } from "@/components/compare/compare-provider";
import { ProductPrice, discountPercent, stockLabel } from "@/components/product/product-price";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { loadCompareProducts } from "@/lib/compare/actions";
import type { ProductWithDetails } from "@/lib/types/database";

const ROWS = [
  { key: "image", label: "الصورة" },
  { key: "name", label: "الاسم" },
  { key: "brand", label: "العلامة" },
  { key: "category", label: "القسم" },
  { key: "price", label: "السعر" },
  { key: "discount", label: "الخصم" },
  { key: "stock", label: "المخزون" },
  { key: "cart", label: "السلة" },
] as const;

export function CompareView({ initialIdsFromUrl }: { initialIdsFromUrl: string[] }) {
  const { ids, remove, setIds, ready } = useCompare();
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const urlIdsKey = initialIdsFromUrl.join(",");

  useEffect(() => {
    if (!ready || initialIdsFromUrl.length === 0) return;
    setIds(initialIdsFromUrl);
  }, [ready, urlIdsKey, initialIdsFromUrl, setIds]);

  const displayIds = useMemo(() => (ready ? ids : []), [ready, ids]);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    if (displayIds.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    void loadCompareProducts(displayIds).then((result) => {
      if (!active) return;
      setProducts(result);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [displayIds, ready]);

  if (!ready || loading) {
    return <p className="py-16 text-center text-[16px] text-graphite">جاري التحميل…</p>;
  }

  if (displayIds.length < 2) {
    return (
      <div className="space-y-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-retail-ink">مقارنة المنتجات</h1>
        <p className="text-lg text-graphite">اختر منتجين على الأقل للمقارنة</p>
        <p className="text-[14px] text-graphite">استخدم زر «قارن» على بطاقة المنتج أو صفحة المنتج لإضافة ما يصل إلى 3 منتجات</p>
        <Button asChild>
          <Link href="/products">تسوق الآن</Link>
        </Button>
      </div>
    );
  }

  const byId = new Map(products.map((product) => [product.id, product]));
  const columns = displayIds.map((id) => byId.get(id)).filter((product): product is ProductWithDetails => product != null);

  if (columns.length < 2) {
    return (
      <div className="space-y-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-retail-ink">مقارنة المنتجات</h1>
        <p className="text-lg text-graphite">تعذّر تحميل المنتجات المحددة للمقارنة</p>
        <Button asChild>
          <Link href="/products">تسوق الآن</Link>
        </Button>
      </div>
    );
  }

  function cellValue(rowKey: (typeof ROWS)[number]["key"], product: ProductWithDetails) {
    const variant = product.defaultVariant;
    switch (rowKey) {
      case "image": {
        const imageUrl = product.images[0]?.url ?? "/placeholder-product.svg";
        return (
          <Link href={`/products/${product.slug}`} className="block">
            <div className="relative mx-auto aspect-square w-full max-w-[160px] overflow-hidden rounded-[8px] bg-[#f3f3f3]">
              <Image
                src={imageUrl}
                alt={product.images[0]?.alt_text || product.name_ar}
                fill
                sizes="160px"
                className="object-contain"
              />
            </div>
          </Link>
        );
      }
      case "name":
        return (
          <Link href={`/products/${product.slug}`} className="font-bold text-retail-ink hover:opacity-80">
            {product.name_ar}
          </Link>
        );
      case "brand":
        return product.brand?.name ?? "—";
      case "category":
        return product.category.name_ar;
      case "price":
        return (
          <ProductPrice
            pricePiasters={variant.price_piasters}
            compareAtPiasters={variant.compare_at_piasters}
          />
        );
      case "discount": {
        const discount = discountPercent(variant.price_piasters, variant.compare_at_piasters);
        return discount != null ? `خصم ${discount}%` : "—";
      }
      case "stock":
        return stockLabel(variant.stock);
      case "cart":
        return <AddToCartButton product={product} variant={variant} />;
      default:
        return "—";
    }
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-retail-ink">مقارنة المنتجات</h1>
        <p className="text-[14px] text-retail-muted">{columns.length} منتجات</p>
      </div>

      <Table containerClassName="rounded-[8px] border border-retail-line bg-paper-white">
        <TableHeader>
          <TableRow>
            <TableHead className="sticky start-0 z-10 min-w-[120px] bg-paper-white">الخاصية</TableHead>
            {columns.map((product) => (
              <TableHead key={product.id} className="min-w-[180px]">
                <div className="flex items-start justify-between gap-2">
                  <span className="line-clamp-2 font-bold text-retail-ink">{product.name_ar}</span>
                  <button
                    type="button"
                    aria-label={`إزالة ${product.name_ar} من المقارنة`}
                    className="shrink-0 rounded-[4px] p-1 text-retail-muted hover:text-retail-ink"
                    onClick={() => remove(product.id)}
                  >
                    <X className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                  </button>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {ROWS.map((row) => (
            <TableRow key={row.key}>
              <TableCell className="sticky start-0 z-10 bg-paper-white font-bold text-retail-ink">{row.label}</TableCell>
              {columns.map((product) => (
                <TableCell key={`${row.key}-${product.id}`}>{cellValue(row.key, product)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
