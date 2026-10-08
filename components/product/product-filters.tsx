"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import type { Brand } from "@/lib/types/database";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ProductFiltersProps {
  brands: Brand[];
  basePath?: string;
  currentSort?: string;
  currentBrand?: string;
  currentMin?: string;
  currentMax?: string;
  currentAvailability?: string;
}

function FilterFields({
  brands,
  currentSort,
  currentBrand,
  currentMin,
  currentMax,
  currentAvailability,
  onChange,
}: {
  brands: Brand[];
  currentSort?: string;
  currentBrand?: string;
  currentMin?: string;
  currentMax?: string;
  currentAvailability?: string;
  onChange: (entries: Record<string, string>) => void;
}) {
  return (
    <>
      <select
        value={currentSort ?? ""}
        onChange={(e) => onChange({ sort: e.target.value })}
        className="h-9 w-full rounded-[4px] border border-ash-border bg-paper-white px-3 text-sm"
        aria-label="الترتيب"
      >
        <option value="">الترتيب الافتراضي</option>
        <option value="price_asc">السعر: الأقل أولاً</option>
        <option value="price_desc">السعر: الأعلى أولاً</option>
        <option value="newest">الأحدث</option>
        <option value="rating">الأعلى تقييماً</option>
      </select>

      <select
        value={currentBrand ?? ""}
        onChange={(e) => onChange({ brand: e.target.value })}
        className="h-9 w-full rounded-[4px] border border-ash-border bg-paper-white px-3 text-sm"
        aria-label="الماركة"
      >
        <option value="">كل الماركات</option>
        {brands.map((b) => (
          <option key={b.id} value={b.slug}>{b.name}</option>
        ))}
      </select>

      <select
        value={currentAvailability ?? ""}
        onChange={(e) => onChange({ availability: e.target.value })}
        className="h-9 w-full rounded-[4px] border border-ash-border bg-paper-white px-3 text-sm"
        aria-label="التوفر"
      >
        <option value="">كل حالات التوفر</option>
        <option value="in_stock">المتوفر فقط</option>
      </select>

      <form
        key={`${currentMin ?? ""}-${currentMax ?? ""}`}
        className="flex flex-wrap items-center gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          onChange({
            min: String(data.get("min") ?? "").trim(),
            max: String(data.get("max") ?? "").trim(),
          });
        }}
      >
        <input
          name="min"
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          defaultValue={currentMin ?? ""}
          placeholder="السعر من"
          aria-label="السعر من بالجنيه"
          className="h-9 w-full rounded-[4px] border border-ash-border bg-paper-white px-3 text-sm sm:w-28"
        />
        <input
          name="max"
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          defaultValue={currentMax ?? ""}
          placeholder="السعر إلى"
          aria-label="السعر إلى بالجنيه"
          className="h-9 w-full rounded-[4px] border border-ash-border bg-paper-white px-3 text-sm sm:w-28"
        />
        <button
          type="submit"
          className="h-9 rounded-[4px] border border-ash-border bg-paper-white px-3 text-sm font-bold"
        >
          تطبيق السعر
        </button>
      </form>
    </>
  );
}

export function ProductFilters({
  brands,
  basePath = "/products",
  currentSort,
  currentBrand,
  currentMin,
  currentMax,
  currentAvailability,
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);

  function updateParams(entries: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(entries)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    router.push(`${basePath}?${params.toString()}`);
    setDrawerOpen(false);
  }

  const activeFilterCount = [currentBrand, currentMin, currentMax, currentAvailability].filter(Boolean).length;

  return (
    <>
      <div className="sticky top-16 z-30 -mx-4 border-b border-mist bg-retail-canvas/95 px-4 py-3 backdrop-blur-sm md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <div className="flex items-center gap-2 md:hidden">
          <select
            value={currentSort ?? ""}
            onChange={(e) => updateParams({ sort: e.target.value })}
            className="h-9 min-w-0 flex-1 rounded-[4px] border border-ash-border bg-paper-white px-3 text-sm"
            aria-label="الترتيب"
          >
            <option value="">الترتيب</option>
            <option value="price_asc">السعر: الأقل</option>
            <option value="price_desc">السعر: الأعلى</option>
            <option value="newest">الأحدث</option>
            <option value="rating">الأعلى تقييماً</option>
          </select>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex h-9 shrink-0 items-center gap-1 rounded-[4px] border border-ash-border bg-paper-white px-3 text-sm font-bold"
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            فلاتر
            {activeFilterCount > 0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-carbon-ink px-1 text-[10px] text-paper-white">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        </div>

        <div className="hidden flex-wrap items-center gap-3 md:flex">
          <FilterFields
            brands={brands}
            currentSort={currentSort}
            currentBrand={currentBrand}
            currentMin={currentMin}
            currentMax={currentMax}
            currentAvailability={currentAvailability}
            onChange={updateParams}
          />
        </div>
      </div>

      <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DialogContent
          className="fixed inset-x-0 bottom-0 top-auto max-h-[85vh] max-w-none translate-x-[-50%] translate-y-0 overflow-y-auto rounded-t-[8px] rounded-b-none p-4 md:hidden"
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle>تصفية المنتجات</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <FilterFields
              brands={brands}
              currentSort={currentSort}
              currentBrand={currentBrand}
              currentMin={currentMin}
              currentMax={currentMax}
              currentAvailability={currentAvailability}
              onChange={updateParams}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
