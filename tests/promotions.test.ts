import { describe, it, expect } from "vitest";
import { validatePromoCode } from "@/lib/promotions";

describe("validatePromoCode", () => {
  it("accepts valid percentage code", () => {
    const result = validatePromoCode("DOLY10", 200000);
    expect(result.valid).toBe(true);
    expect(result.discountPiasters).toBe(20000);
  });

  it("rejects invalid code", () => {
    const result = validatePromoCode("INVALID", 200000);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("rejects when below minimum order", () => {
    const result = validatePromoCode("DOLY10", 5000);
    expect(result.valid).toBe(false);
  });

  it("is case insensitive", () => {
    const result = validatePromoCode("doly10", 200000);
    expect(result.valid).toBe(true);
  });
});
