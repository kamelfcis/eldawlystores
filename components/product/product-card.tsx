"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCart } from "@/components/cart/cart-provider";
import { ProductPrice, stockLabel } from "@/components/product/product-price";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { CompareButton } from "@/components/compare/compare-button";
import type { ProductWithDetails } from "@/lib/types/database";

function QuickAdd({ product, className }: { product: ProductWithDetails; className?: string }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const variant = product.defaultVariant;
  const unavailable = variant.stock <= 0;

  return (
    <Button
      type="button"
      variant="retail"
      size="sm"
      disabled={unavailable}
      className={className ?? "mt-3 w-full"}
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
        window.setTimeout(() => setAdded(false), 1600);
      }}
    >
      {unavailable ? "نفذت الكمية" : added ? "تمت الإضافة" : "أضف إلى السلة"}
    </Button>
  );
}

export function ProductCard({ product }: { product: ProductWithDetails }) {
  const variant = product.defaultVariant;
  const primary = product.images[0];
  const secondary = product.images[1];
  const imageUrl = primary?.url ?? "/placeholder-product.svg";
  const [quickOpen, setQuickOpen] = useState(false);

  return (
    <article className="product-card-lift group relative flex h-full flex-col rounded-[8px] border border-retail-line bg-retail-canvas shadow-[0_8px_24px_rgb(26_33_30/0.06)] motion-safe:will-change-transform">
      <div className="absolute top-2 start-2 z-10 flex flex-col gap-2">
        <WishlistButton productId={product.id} className="h-9 w-9 border-retail-line/80 bg-paper-white/95" />
        <CompareButton productId={product.id} className="h-9 w-9 border-retail-line/80 bg-paper-white/95" />
      </div>

      <Link href={`/products/${product.slug}`} className="block rounded-[8px] focus-visible:outline focus-visible:outline-1 focus-visible:outline-retail-ink">
        <div className="relative aspect-square overflow-hidden rounded-[8px] bg-[#f5f5f3]">
          <Image
            src={imageUrl}
            alt={primary?.alt_text || product.name_ar}
            fill
            className="product-card-image-zoom object-contain"
            sizes="(max-width: 768px) 78vw, 25vw"
          />
          {secondary ? (
            <Image
              src={secondary.url}
              alt=""
              aria-hidden
              fill
              className="product-image-alt product-card-image-zoom object-contain"
              sizes="(max-width: 768px) 78vw, 25vw"
            />
          ) : null}
        </div>
      </Link>

      <div className="mt-3 flex flex-1 flex-col px-3 pb-3">
        <Link href={`/products/${product.slug}`} className="block">
          <h3 className="line-clamp-2 min-h-12 text-[16px] leading-normal text-retail-ink">{product.name_ar}</h3>
          {product.brand ? <p className="mt-1 text-[14px] text-retail-muted">{product.brand.name}</p> : null}
        </Link>
        <div className="mt-2">
          <ProductPrice pricePiasters={variant.price_piasters} compareAtPiasters={variant.compare_at_piasters} />
        </div>
        <p className="mt-1 text-[14px] text-retail-muted">{stockLabel(variant.stock)}</p>

        <Dialog open={quickOpen} onOpenChange={setQuickOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="mt-3 w-full">
              <Eye className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              معاينة سريعة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:max-h-[90vh] max-sm:max-w-none max-sm:translate-x-[-50%] max-sm:translate-y-0 max-sm:overflow-y-auto max-sm:rounded-t-[8px] max-sm:rounded-b-none">
            <DialogHeader>
              <DialogTitle>{product.name_ar}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-[8px] bg-[#f3f3f3]">
                <Image
                  src={imageUrl}
                  alt={primary?.alt_text || product.name_ar}
                  fill
                  className="object-contain"
                  sizes="280px"
                />
              </div>
              <ProductPrice pricePiasters={variant.price_piasters} compareAtPiasters={variant.compare_at_piasters} />
              <p className="text-[14px] text-retail-muted">{stockLabel(variant.stock)}</p>
              <QuickAdd product={product} className="w-full" />
              <Button asChild variant="outline" className="w-full">
                <Link href={`/products/${product.slug}`} onClick={() => setQuickOpen(false)}>
                  عرض صفحة المنتج
                </Link>
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <QuickAdd product={product} />
      </div>
    </article>
  );
}
