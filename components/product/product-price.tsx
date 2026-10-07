import { formatMoney } from "@/lib/money";

export function savingsPiasters(pricePiasters: number, compareAtPiasters: number | null): number | null {
  if (compareAtPiasters == null || compareAtPiasters <= pricePiasters) return null;
  return compareAtPiasters - pricePiasters;
}

export function discountPercent(pricePiasters: number, compareAtPiasters: number | null): number | null {
  if (compareAtPiasters == null || compareAtPiasters <= pricePiasters) return null;
  return Math.round((1 - pricePiasters / compareAtPiasters) * 100);
}

export function stockLabel(stock: number): string {
  if (stock <= 0) return "نفذت الكمية";
  if (stock <= 5) return "مخزون منخفض";
  return "متوفر";
}

export function ProductPrice({
  pricePiasters,
  compareAtPiasters,
  size = "card",
}: {
  pricePiasters: number;
  compareAtPiasters: number | null;
  size?: "card" | "page";
}) {
  const savings = savingsPiasters(pricePiasters, compareAtPiasters);
  const discount = discountPercent(pricePiasters, compareAtPiasters);
  const priceClass = size === "page" ? "text-[24px] font-bold" : "text-[16px]";

  return (
    <div className="space-y-1">
      {discount != null ? (
        <span className="inline-flex rounded-full bg-retail-red px-2 py-1 text-[14px] leading-none text-paper-white shadow-[0_2px_6px_rgb(26_33_30/0.12)]">
          خصم {discount}%
        </span>
      ) : null}
      <div className="flex flex-wrap items-baseline gap-2">
        <span className={`${priceClass} text-retail-red`}>{formatMoney(pricePiasters)}</span>
        {savings != null ? (
          <span className="text-[14px] text-retail-muted line-through">{formatMoney(compareAtPiasters ?? 0)}</span>
        ) : null}
      </div>
      {savings != null ? <p className="text-[14px] font-bold text-retail-red">يوفر {formatMoney(savings)}</p> : null}
    </div>
  );
}
