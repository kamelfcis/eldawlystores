"use client";

import { Heart } from "lucide-react";
import { useWishlist } from "@/components/wishlist/wishlist-provider";
import { cn } from "@/lib/utils/cn";

export function WishlistButton({
  productId,
  className,
}: {
  productId: string;
  className?: string;
}) {
  const { has, toggle } = useWishlist();
  const saved = has(productId);

  return (
    <button
      type="button"
      aria-label={saved ? "إزالة من المفضلة" : "أضف إلى المفضلة"}
      aria-pressed={saved}
      className={cn(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] border border-retail-line bg-paper-white text-retail-ink transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-1 focus-visible:outline-retail-ink",
        className
      )}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle(productId);
      }}
    >
      <Heart
        className="h-5 w-5"
        strokeWidth={1.5}
        fill={saved ? "currentColor" : "none"}
        aria-hidden
      />
    </button>
  );
}
