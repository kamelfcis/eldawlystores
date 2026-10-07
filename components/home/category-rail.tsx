"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Category } from "@/lib/types/database";

export function CategoryRail({ categories }: { categories: Category[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollBy(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === "rtl";
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    el.scrollBy({ left: (rtl ? -direction : direction) * 240, behavior });
  }

  if (categories.length === 0) return null;

  return (
    <div className="flex min-w-0 items-start gap-2">
      <div ref={scrollerRef} className="scrollbar-hide flex min-w-0 flex-1 gap-4 overflow-x-auto pt-2 pb-2">
        {categories.map((category) => {
          const image = category.image_url?.trim() || null;
          return (
            <Link key={category.id} href={`/categories/${category.slug}`} className="group w-[88px] shrink-0 text-center">
              <div className="relative size-[88px] overflow-hidden rounded-full bg-[#f3f3f3] shadow-[0_8px_24px_rgb(26_33_30/0.06)] ring-1 ring-retail-line motion-safe:transition-[translate] motion-safe:duration-200 motion-safe:ease-out md:motion-safe:group-hover:-translate-y-[2px]">
                {image ? (
                  <Image src={image} alt="" fill sizes="88px" className="object-cover object-center" />
                ) : null}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_0_0_1px_rgb(255_255_255/0.9)]"
                />
              </div>
              <p className="mt-2 line-clamp-2 text-center text-[14px] leading-tight text-retail-ink">{category.name_ar}</p>
            </Link>
          );
        })}
      </div>
      <div className="mt-8 hidden shrink-0 gap-1 md:flex">
        <button
          type="button"
          aria-label="السابق"
          onClick={() => scrollBy(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-[4px] border border-retail-line bg-retail-canvas text-retail-ink"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          aria-label="التالي"
          onClick={() => scrollBy(1)}
          className="flex h-10 w-10 items-center justify-center rounded-[4px] border border-retail-line bg-retail-canvas text-retail-ink"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
