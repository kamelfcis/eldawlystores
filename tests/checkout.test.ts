import { describe, it, expect } from "vitest";
import { validateCheckoutItems } from "@/lib/checkout";

describe("validateCheckoutItems", () => {
  it("validates items with sufficient stock", () => {
    const result = validateCheckoutItems([{ variantId: "var-1", quantity: 1 }]);
    expect(result.valid).toBe(true);
    expect(result.lineItems).toHaveLength(1);
    expect(result.lineItems[0].unitPricePiasters).toBe(6499900);
  });

  it("rejects unknown variant", () => {
    const result = validateCheckoutItems([{ variantId: "unknown", quantity: 1 }]);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("rejects insufficient stock", () => {
    const result = validateCheckoutItems([{ variantId: "var-4", quantity: 999 }]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("المخزون");
  });
});
