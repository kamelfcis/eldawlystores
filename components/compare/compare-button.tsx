"use client";

import { GitCompare } from "lucide-react";
import { useCompare } from "@/components/compare/compare-provider";
import { notify } from "@/lib/feedback/notify";
import { cn } from "@/lib/utils/cn";

export function CompareButton({
  productId,
  className,
  showLabel = false,
}: {
  productId: string;
  className?: string;
  showLabel?: boolean;
}) {
  const { has, add, remove } = useCompare();
  const active = has(productId);

  return (
    <button
      type="button"
      aria-label={active ? "إزالة من المقارنة" : "أضف للمقارنة"}
      aria-pressed={active}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[4px] border border-retail-line bg-paper-white text-retail-ink transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-1 focus-visible:outline-retail-ink",
        showLabel ? "h-10 px-3 text-[14px] font-bold tracking-[0.038em]" : "h-9 w-9",
        active && "border-retail-ink bg-fog",
        className
      )}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (active) {
          remove(productId);
          return;
        }
        const result = add(productId);
        if (result === "limit") {
          notify.warning("يمكنك مقارنة 3 منتجات كحد أقصى");
          return;
        }
        notify.success("أُضيف للمقارنة");
      }}
    >
      <GitCompare className="h-4 w-4" strokeWidth={1.5} aria-hidden />
      {showLabel ? <span>قارن</span> : null}
    </button>
  );
}
