/** All money stored as integer piasters (1 EGP = 100 piasters). */

export function formatMoney(piasters: number): string {
  const pounds = piasters / 100;
  return `${pounds.toLocaleString("ar-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م`;
}

export function piastersToPounds(piasters: number): number {
  return piasters / 100;
}

export function poundsToPiasters(pounds: number): number {
  return Math.round(pounds * 100);
}

export function calculateDiscountPercent(
  pricePiasters: number,
  compareAtPiasters: number | null
): number | null {
  if (!compareAtPiasters || compareAtPiasters <= pricePiasters) return null;
  return Math.round(((compareAtPiasters - pricePiasters) / compareAtPiasters) * 100);
}

export interface OrderTotalsInput {
  items: { unitPricePiasters: number; quantity: number }[];
  shippingPiasters: number;
  discountPiasters: number;
}

export function calculateOrderTotals(input: OrderTotalsInput) {
  const subtotalPiasters = input.items.reduce(
    (sum, item) => sum + item.unitPricePiasters * item.quantity,
    0
  );
  const totalPiasters = Math.max(0, subtotalPiasters + input.shippingPiasters - input.discountPiasters);
  return { subtotalPiasters, totalPiasters, shippingPiasters: input.shippingPiasters, discountPiasters: input.discountPiasters };
}
