"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { categoryAccentMark } from "@/lib/category-accent";
import { cn } from "@/lib/utils/cn";
import type { Category } from "@/lib/types/database";

interface CategoryPillsProps {
  categories: Category[];
  activeSlug?: string;
}

const pillClass =
  "inline-flex h-10 shrink-0 items-center rounded-full px-5 text-[16px] font-bold tracking-[0.057em]";

export function CategoryPills({ categories, activeSlug }: CategoryPillsProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollBy(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === "rtl";
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    el.scrollBy({ left: (rtl ? -direction : direction) * 220, behavior });
  }

  return (
    <div className="flex items-center gap-2">
      <div ref={scrollerRef} className="scrollbar-hide flex flex-1 gap-2 overflow-x-auto">
        <Link
          href="/products"
          className={cn(
            pillClass,
            !activeSlug
              ? "bg-carbon-ink text-paper-white"
              : "border border-ash-border bg-transparent text-slate"
          )}
        >
          الكل
        </Link>
        {categories.map((category, index) => (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            className={cn(
              pillClass,
              activeSlug === category.slug
                ? "bg-carbon-ink text-paper-white"
                : "border border-ash-border bg-transparent text-slate"
            )}
          >
            <span aria-hidden className={cn("me-2 size-2.5 shrink-0 rounded-full", categoryAccentMark(index))} />
            {category.name_ar}
          </Link>
        ))}
      </div>
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          aria-label="السابق"
          onClick={() => scrollBy(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-[4px] border border-ash-border text-carbon-ink"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          aria-label="التالي"
          onClick={() => scrollBy(1)}
          className="flex h-10 w-10 items-center justify-center rounded-[4px] border border-ash-border text-carbon-ink"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
