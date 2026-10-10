export type ShippingBand = "all" | "cairo" | "alex" | "rest" | "range";

export const SHIPPING_BANDS: Array<{ id: ShippingBand; label: string }> = [
  { id: "all", label: "الكل" },
  { id: "cairo", label: "القاهرة/الجيزة (5000)" },
  { id: "alex", label: "الإسكندرية/القليوبية (7000)" },
  { id: "rest", label: "باقي المحافظات (8000)" },
  { id: "range", label: "نطاق قرش" },
];

type ShippingFilterInput = {
  query: string;
  band: ShippingBand;
  minPiasters: string;
  maxPiasters: string;
};

export function shippingFiltersActive({ query, band }: ShippingFilterInput): boolean {
  return Boolean(query.trim()) || band !== "all";
}

export function filterShippingRates<T extends { governorate: string; rate_piasters: number }>(
  rates: readonly T[],
  { query, band, minPiasters, maxPiasters }: ShippingFilterInput
): T[] {
  const needle = query.trim().toLowerCase();
  const applyRange = band === "range";
  const min = applyRange && /^\d+$/.test(minPiasters) ? Number(minPiasters) : null;
  const max = applyRange && /^\d+$/.test(maxPiasters) ? Number(maxPiasters) : null;

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
