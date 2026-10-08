"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Category } from "@/lib/types/database";

function CategoryGrid({ categories, onNavigate }: { categories: Category[]; onNavigate?: () => void }) {
  return (
    <div className="grid min-w-0 grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {categories.map((category) => {
        const image = category.image_url?.trim() || null;
        return (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            className="group min-w-0 text-center"
            onClick={onNavigate}
          >
            <div className="relative mx-auto size-[72px] overflow-hidden rounded-full bg-[#f3f3f3] shadow-[0_8px_24px_rgb(26_33_30/0.06)] ring-1 ring-retail-line motion-safe:transition-[translate] motion-safe:duration-200 motion-safe:ease-out lg:motion-safe:group-hover:-translate-y-[2px]">
              {image ? (
                <Image src={image} alt="" fill sizes="72px" className="object-cover object-center" />
              ) : null}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_0_0_1px_rgb(255_255_255/0.9)]"
              />
            </div>
            <p className="mt-2 line-clamp-2 text-[14px] leading-tight text-retail-ink">{category.name_ar}</p>
          </Link>
        );
      })}
    </div>
  );
}

export function CategoryMegaMenu({
  categories,
  placement,
}: {
  categories: Category[];
  placement?: "desktop" | "mobile";
}) {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDesktopOpen(false);
        setMobileOpen(false);
      }
    }
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setDesktopOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, []);

  if (categories.length === 0) return null;

  const showDesktop = placement !== "mobile";
  const showMobile = placement !== "desktop";

  return (
    <>
      {showDesktop ? (
      <div ref={rootRef} className="relative hidden lg:block">
        <button
          type="button"
          className="inline-flex items-center gap-1 text-[16px] font-bold tracking-[0.057em] text-slate hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-carbon-ink"
          aria-haspopup="true"
          aria-expanded={desktopOpen}
          aria-controls={panelId}
          onClick={() => setDesktopOpen((current) => !current)}
        >
          الأقسام
          <ChevronDown className={`h-4 w-4 transition-transform ${desktopOpen ? "rotate-180" : ""}`} strokeWidth={1.5} aria-hidden />
        </button>
        {desktopOpen ? (
          <div
            id={panelId}
            role="region"
            aria-label="قائمة الأقسام"
            className="absolute start-0 top-full z-50 mt-3 w-[min(720px,calc(100vw-2rem))] rounded-[8px] border border-mist bg-paper-white p-4 shadow-[0_8px_24px_rgb(26_33_30/0.06)]"
          >
            <CategoryGrid categories={categories} onNavigate={() => setDesktopOpen(false)} />
            <div className="mt-4 border-t border-mist pt-4">
              <Link
                href="/categories"
                className="text-[14px] font-bold tracking-[0.038em] text-carbon-ink hover:opacity-80"
                onClick={() => setDesktopOpen(false)}
              >
                عرض كل الأقسام
              </Link>
            </div>
          </div>
        ) : null}
      </div>
      ) : null}

      {showMobile ? (
      <div className="lg:hidden">
        <button
          type="button"
          className="inline-flex items-center gap-1 text-[16px] font-bold tracking-[0.057em] text-slate hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-carbon-ink"
          aria-haspopup="dialog"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(true)}
        >
          الأقسام
          <ChevronDown className="h-4 w-4" strokeWidth={1.5} aria-hidden />
        </button>
        <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
          <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
            <DialogHeader>
              <DialogTitle>الأقسام</DialogTitle>
            </DialogHeader>
            <CategoryGrid categories={categories} onNavigate={() => setMobileOpen(false)} />
            <Link
              href="/categories"
              className="mt-4 inline-block text-[14px] font-bold tracking-[0.038em] text-carbon-ink hover:opacity-80"
              onClick={() => setMobileOpen(false)}
            >
              عرض كل الأقسام
            </Link>
          </DialogContent>
        </Dialog>
      </div>
      ) : null}
    </>
  );
}
