"use client";

import { useRef, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Category } from "@/lib/types/database";

const discMotion =
  "relative size-[88px] overflow-hidden rounded-full shadow-[0_8px_24px_rgb(26_33_30/0.06)] motion-safe:transition-[translate,box-shadow] motion-safe:duration-[var(--motion-micro)] motion-safe:ease-[var(--motion-ease)] md:motion-safe:group-hover:-translate-y-[2px] md:motion-safe:group-focus-visible:-translate-y-[2px]";

function DiscLink({
  href,
  label,
  current,
  children,
}: {
  href: string;
  label: string;
  current?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className="group w-[88px] shrink-0 snap-start text-center"
    >
      <div
        className={cn(
          discMotion,
          current
            ? "ring-2 ring-retail-red"
            : "ring-1 ring-retail-line md:group-hover:ring-2 md:group-focus-visible:ring-2 md:group-hover:ring-retail-red md:group-focus-visible:ring-retail-red",
        )}
      >
        {children}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_0_0_1px_rgb(255_255_255/0.9)]"
        />
      </div>
      <p className="mt-2 line-clamp-2 text-center text-[14px] leading-tight text-retail-ink">{label}</p>
    </Link>
  );
}

export function CategoryRail({
  categories,
  activeSlug,
  showAll = false,
}: {
  categories: Category[];
  activeSlug?: string;
  showAll?: boolean;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollBy(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === "rtl";
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    el.scrollBy({ left: (rtl ? -direction : direction) * 240, behavior });
  }

  if (categories.length === 0 && !showAll) return null;

  return (
    <div className="flex min-w-0 items-start gap-2">
      <div
        ref={scrollerRef}
        className="touch-rail scrollbar-hide flex min-w-0 flex-1 flex-nowrap gap-2.5 overflow-x-auto pt-2 pb-2"
      >
        {showAll ? (
          <DiscLink href="/products" label="الكل" current={!activeSlug}>
            <div className="flex size-full items-center justify-center bg-fog">
              <p className="text-[14px] font-bold tracking-[0.038em] text-retail-ink">الكل</p>
            </div>
          </DiscLink>
        ) : null}
        {categories.map((category) => {
          const image = category.image_url?.trim() || null;
          const current = activeSlug === category.slug;
          return (
            <DiscLink key={category.id} href={`/categories/${category.slug}`} label={category.name_ar} current={current}>
              <div className="absolute inset-0 bg-[#f3f3f3]">
                {image ? <Image src={image} alt="" fill sizes="88px" className="object-cover object-center" /> : null}
              </div>
            </DiscLink>
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
