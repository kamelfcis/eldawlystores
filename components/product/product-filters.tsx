"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Brand } from "@/lib/types/database";

interface ProductFiltersProps {
  brands: Brand[];
  currentSort?: string;
  currentBrand?: string;
  currentMin?: string;
  currentMax?: string;
  currentAvailability?: string;
}

export function ProductFilters({
  brands,
  currentSort,
  currentBrand,
  currentMin,
  currentMax,
  currentAvailability,
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParams(entries: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(entries)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    router.push(`/products?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={currentSort ?? ""}
        onChange={(e) => updateParams({ sort: e.target.value })}
        className="h-9 rounded-[4px] border border-ash-border bg-paper-white px-3 text-sm"
        aria-label="الترتيب"
      >
        <option value="">الترتيب الافتراضي</option>
        <option value="price_asc">السعر: الأقل أولاً</option>
        <option value="price_desc">السعر: الأعلى أولاً</option>
        <option value="rating">الأعلى تقييماً</option>
      </select>

      <select
        value={currentBrand ?? ""}
        onChange={(e) => updateParams({ brand: e.target.value })}
        className="h-9 rounded-[4px] border border-ash-border bg-paper-white px-3 text-sm"
        aria-label="الماركة"
      >
        <option value="">كل الماركات</option>
        {brands.map((b) => (
          <option key={b.id} value={b.slug}>{b.name}</option>
        ))}
      </select>

      <select
        value={currentAvailability ?? ""}
        onChange={(e) => updateParams({ availability: e.target.value })}
        className="h-9 rounded-[4px] border border-ash-border bg-paper-white px-3 text-sm"
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
          updateParams({
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
          className="h-9 w-28 rounded-[4px] border border-ash-border bg-paper-white px-3 text-sm"
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
          className="h-9 w-28 rounded-[4px] border border-ash-border bg-paper-white px-3 text-sm"
        />
        <button
          type="submit"
          className="h-9 rounded-[4px] border border-ash-border bg-paper-white px-3 text-sm font-bold"
        >
          تطبيق السعر
        </button>
      </form>
    </div>
  );
}
