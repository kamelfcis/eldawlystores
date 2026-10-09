/** Totals for the checkout review step. A missing rate stays omitted. */
export function reviewCheckoutTotals(
  subtotalPiasters: number,
  shippingPiasters: number | null
): {
  subtotalPiasters: number;
  shippingPiasters: number | null;
  orderTotalPiasters: number | null;
} {
  if (shippingPiasters == null) {
    return { subtotalPiasters, shippingPiasters: null, orderTotalPiasters: null };
  }

  return {
    subtotalPiasters,
    shippingPiasters,
    orderTotalPiasters: subtotalPiasters + shippingPiasters,
  };
}
