import { poundsToPiasters } from "@/lib/money";

export type ShippingBand = "all" | "cairo" | "alex" | "rest" | "range";

export const SHIPPING_BANDS: Array<{ id: ShippingBand; label: string }> = [
  { id: "all", label: "الكل" },
  { id: "cairo", label: "القاهرة/الجيزة (50 ج.م)" },
  { id: "alex", label: "الإسكندرية/القليوبية (70 ج.م)" },
  { id: "rest", label: "باقي المحافظات (80 ج.م)" },
  { id: "range", label: "نطاق بالجنيه" },
];

type ShippingFilterInput = {
  query: string;
  band: ShippingBand;
  minPounds: string;
  maxPounds: string;
};

export function poundsRangeToPiasters(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  return poundsToPiasters(Number(value));
}

export function shippingFiltersActive({ query, band }: ShippingFilterInput): boolean {
  return Boolean(query.trim()) || band !== "all";
}

export function filterShippingRates<T extends { governorate: string; rate_piasters: number }>(
  rates: readonly T[],
  { query, band, minPounds, maxPounds }: ShippingFilterInput
): T[] {
  const needle = query.trim().toLowerCase();
  const applyRange = band === "range";
  const min = applyRange ? poundsRangeToPiasters(minPounds) : null;
  const max = applyRange ? poundsRangeToPiasters(maxPounds) : null;

  return rates.filter((rate) => {
    if (needle && !rate.governorate.toLowerCase().includes(needle)) return false;
    if (band === "cairo") return rate.rate_piasters === 5000;
    if (band === "alex") return rate.rate_piasters === 7000;
    if (band === "rest") return rate.rate_piasters === 8000;
    if (band === "range") {
      if (min != null && rate.rate_piasters < min) return false;
      if (max != null && rate.rate_piasters > max) return false;
    }
    return true;
  });
}
