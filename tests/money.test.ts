import { describe, it, expect } from "vitest";
import {
  formatMoney,
  poundsToPiasters,
  piastersToPounds,
  calculateDiscountPercent,
  calculateOrderTotals,
} from "@/lib/money";

describe("money", () => {
  it("formats piasters as EGP", () => {
    const formatted = formatMoney(499900);
    expect(formatted).toContain("ج.م");
    expect(formatted).toMatch(/[4٤]/);
  });

  it("converts pounds to piasters", () => {
    expect(poundsToPiasters(49.99)).toBe(4999);
    expect(poundsToPiasters(100)).toBe(10000);
  });

  it("converts 80 pounds to 8000 piasters and back", () => {
    expect(poundsToPiasters(80)).toBe(8000);
    expect(piastersToPounds(8000)).toBe(80);
  });

  it("converts piasters to pounds", () => {
    expect(piastersToPounds(10000)).toBe(100);
  });

  it("calculates discount percent", () => {
    expect(calculateDiscountPercent(8000, 10000)).toBe(20);
    expect(calculateDiscountPercent(10000, 8000)).toBeNull();
    expect(calculateDiscountPercent(10000, null)).toBeNull();
  });
});

describe("calculateOrderTotals", () => {
  it("sums items plus shipping minus discount", () => {
    const result = calculateOrderTotals({
      items: [
        { unitPricePiasters: 100000, quantity: 2 },
        { unitPricePiasters: 50000, quantity: 1 },
      ],
      shippingPiasters: 5000,
      discountPiasters: 10000,
    });
    expect(result.subtotalPiasters).toBe(250000);
    expect(result.totalPiasters).toBe(245000);
  });

  it("never returns negative total", () => {
    const result = calculateOrderTotals({
      items: [{ unitPricePiasters: 1000, quantity: 1 }],
      shippingPiasters: 0,
      discountPiasters: 5000,
    });
    expect(result.totalPiasters).toBe(0);
  });
});
