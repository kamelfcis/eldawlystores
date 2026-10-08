"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronLeft, Menu, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import type { Brand, Category } from "@/lib/types/database";

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
  brandsByCategory,
  placement,
}: {
  categories: Category[];
  brandsByCategory: Record<string, Brand[]>;
  placement?: "desktop" | "mobile";
}) {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

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
          className="inline-flex size-11 items-center justify-center text-carbon-ink hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-carbon-ink"
          aria-haspopup="dialog"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "إغلاق الأقسام" : "الأقسام"}
          onClick={() => {
            if (mobileOpen) {
              setMobileOpen(false);
              setActiveCategoryId(null);
            } else {
              setMobileOpen(true);
            }
          }}
        >
          {mobileOpen ? <X className="h-5 w-5" strokeWidth={1.5} /> : <Menu className="h-5 w-5" strokeWidth={1.5} />}
        </button>
        <MobileCategoryDrawer
          open={mobileOpen}
          categories={categories}
          brandsByCategory={brandsByCategory}
          activeCategoryId={activeCategoryId}
          onOpenChange={(next) => {
            setMobileOpen(next);
            if (!next) setActiveCategoryId(null);
          }}
          onSelectCategory={setActiveCategoryId}
          onBack={() => setActiveCategoryId(null)}
        />
      </div>
      ) : null}
    </>
  );
}

function MobileCategoryDrawer({
  open,
  categories,
  brandsByCategory,
  activeCategoryId,
  onOpenChange,
  onSelectCategory,
  onBack,
}: {
  open: boolean;
  categories: Category[];
  brandsByCategory: Record<string, Brand[]>;
  activeCategoryId: string | null;
  onOpenChange: (open: boolean) => void;
  onSelectCategory: (id: string) => void;
  onBack: () => void;
}) {
  const active = categories.find((category) => category.id === activeCategoryId) ?? null;
  const brands = active ? brandsByCategory[active.id] ?? [] : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="inset-0 top-0 left-0 h-dvh max-h-none w-full max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-none border-0 p-0">
        <DialogHeader className="flex-row items-center justify-between border-b border-mist px-4 py-4">
          <DialogTitle>{active ? active.name_ar : "الأقسام"}</DialogTitle>
          <ThemeToggle />
        </DialogHeader>
        {active ? (
          <div className="px-2 py-2">
            <button
              type="button"
              onClick={onBack}
              className="flex h-11 w-full items-center gap-2 px-2 text-[14px] font-bold text-carbon-ink"
            >
              رجوع
            </button>
            <Link
              href={`/categories/${active.slug}`}
              onClick={() => onOpenChange(false)}
              className="flex h-12 items-center px-3 text-[16px] font-bold text-carbon-ink"
            >
              كل منتجات القسم
            </Link>
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/categories/${active.slug}?brand=${brand.slug}`}
                onClick={() => onOpenChange(false)}
                className="flex h-12 items-center gap-3 px-3 text-[16px] text-retail-ink"
              >
                {brand.logo_url ? (
                  <Image src={brand.logo_url} alt="" width={28} height={28} className="size-7 rounded-full object-contain" />
                ) : null}
                {brand.name}
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-2 py-2">
            {categories.map((category) => {
              const image = category.image_url?.trim() || null;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onSelectCategory(category.id)}
                  className="flex h-14 w-full items-center gap-3 px-2 text-start"
                >
                  <span className="relative size-10 shrink-0 overflow-hidden rounded-full bg-fog">
                    {image ? <Image src={image} alt="" fill sizes="40px" className="object-cover" /> : null}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[16px] text-retail-ink">{category.name_ar}</span>
                  <ChevronLeft className="h-4 w-4 shrink-0 text-graphite" aria-hidden />
                </button>
              );
            })}
            <Link
              href="/categories"
              onClick={() => onOpenChange(false)}
              className="mt-2 flex h-12 items-center px-3 text-[14px] font-bold text-carbon-ink"
            >
              كل الأقسام
            </Link>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
