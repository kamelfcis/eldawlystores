"use client";

import { useState } from "react";
import { GitCompare } from "lucide-react";
import { useCompare } from "@/components/compare/compare-provider";
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
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className={cn("relative", showLabel ? "inline-flex flex-col items-start gap-1" : "inline-flex")}>
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
            setMessage("يمكنك مقارنة 3 منتجات كحد أقصى");
            window.setTimeout(() => setMessage(null), 2800);
          }
        }}
      >
        <GitCompare className="h-4 w-4" strokeWidth={1.5} aria-hidden />
        {showLabel ? <span>قارن</span> : null}
      </button>
      {message ? (
        <p role="status" className="absolute top-full z-10 mt-1 w-max max-w-[220px] rounded-[4px] bg-carbon-ink px-2 py-1 text-[12px] text-paper-white">
          {message}
        </p>
      ) : null}
    </div>
  );
}
