"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import type { ProductWithDetails } from "@/lib/types/database";

interface ProductRailProps {
  products: ProductWithDetails[];
}

export function ProductRail({ products }: ProductRailProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);
  const pausedRef = useRef(false);
  const hoverPausedRef = useRef(false);
  const focusPausedRef = useRef(false);
  const pointerPausedRef = useRef(false);
  const [index, setIndex] = useState(0);
  const [reduced, setReduced] = useState(true);
  const [canScroll, setCanScroll] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const measure = () => setCanScroll(el.scrollWidth > el.clientWidth + 8);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [products.length]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const syncIndexFromScroll = () => {
      const cards = el.querySelectorAll<HTMLElement>("[data-rail-card]");
      if (cards.length === 0) return;

      const rtl = getComputedStyle(el).direction === "rtl";
      const elRect = el.getBoundingClientRect();

      let nearest = 0;
      let minDistance = Infinity;

      cards.forEach((card, i) => {
        const cardRect = card.getBoundingClientRect();
        const distance = rtl
          ? Math.abs(cardRect.right - elRect.right)
          : Math.abs(cardRect.left - elRect.left);
        if (distance < minDistance) {
          minDistance = distance;
          nearest = i;
        }
      });

      if (nearest !== indexRef.current) {
        indexRef.current = nearest;
        setIndex(nearest);
      }
    };

    el.addEventListener("scroll", syncIndexFromScroll, { passive: true });
    return () => el.removeEventListener("scroll", syncIndexFromScroll);
  }, [products.length]);

  const alignTo = useCallback((target: number, behavior: ScrollBehavior) => {
    const el = scrollerRef.current;
    const card = el?.querySelectorAll<HTMLElement>("[data-rail-card]")[target];
    if (!el || !card) return;
    const rtl = getComputedStyle(el).direction === "rtl";
    const elRect = el.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const delta = rtl ? cardRect.right - elRect.right : cardRect.left - elRect.left;
    el.scrollBy({ left: delta, behavior });
  }, []);

  const go = useCallback(
    (direction: 1 | -1, wrap = true) => {
      if (products.length === 0) return;
      const next = indexRef.current + direction;
      if (!wrap && (next < 0 || next >= products.length)) return;
      const wrapped = next < 0 || next >= products.length;
      const target = (next + products.length) % products.length;
      indexRef.current = target;
      setIndex(target);
      alignTo(target, reduced || wrapped ? "auto" : "smooth");
    },
    [alignTo, products.length, reduced]
  );

  function syncPaused() {
    pausedRef.current = hoverPausedRef.current || focusPausedRef.current || pointerPausedRef.current;
  }

  function pauseForPointer(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    pointerPausedRef.current = true;
    syncPaused();
    const end = () => {
      pointerPausedRef.current = false;
      syncPaused();
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  }

  if (products.length === 0) {
    return (
      <div className="py-16 text-center text-graphite">
        <p className="text-[16px]">لا توجد منتجات</p>
        <p className="mt-2 text-[14px]">جرب تغيير الفلاتر أو البحث</p>
      </div>
    );
  }

  return (
    <div
      className="space-y-3"
      onPointerDown={pauseForPointer}
      onMouseEnter={() => {
        if (window.matchMedia("(hover: none)").matches) return;
        hoverPausedRef.current = true;
        syncPaused();
      }}
      onMouseLeave={() => {
        if (window.matchMedia("(hover: none)").matches) return;
        hoverPausedRef.current = false;
        syncPaused();
      }}
      onFocusCapture={() => {
        focusPausedRef.current = true;
        syncPaused();
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          focusPausedRef.current = false;
          syncPaused();
        }
      }}
    >
      <div className="hidden items-center justify-end gap-1 md:flex">
        <button
          type="button"
          aria-label="المنتج السابق"
          disabled={!canScroll}
          onClick={() => go(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-[4px] border border-retail-line text-retail-ink disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          aria-label="المنتج التالي"
          disabled={!canScroll}
          onClick={() => go(1)}
          className="flex h-10 w-10 items-center justify-center rounded-[4px] border border-retail-line text-retail-ink disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>

      <div
        ref={scrollerRef}
        className="touch-rail product-rail flex flex-nowrap gap-6 overflow-x-auto scrollbar-hide"
      >
        {products.map((product) => (
          <div
            key={product.id}
            data-rail-card
            className="w-[min(280px,78vw)] shrink-0 snap-start md:w-[calc((100%-48px)/3)] lg:w-[calc((100%-72px)/4)] xl:w-[calc((100%-96px)/5)]"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {canScroll && (
        <div className="flex items-center justify-center gap-2" role="tablist" aria-label="موضع المنتجات">
          {products.map((product, dot) => (
            <button
              key={product.id}
              type="button"
              role="tab"
              aria-selected={dot === index}
              aria-label={`المنتج ${dot + 1}`}
              onClick={() => {
                const distance = Math.abs(dot - indexRef.current);
                indexRef.current = dot;
                setIndex(dot);
                alignTo(dot, reduced || distance > 1 ? "auto" : "smooth");
              }}
              className={dot === index ? "h-2 w-2 rounded-full bg-carbon-ink" : "h-2 w-2 rounded-full bg-ash-border"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
