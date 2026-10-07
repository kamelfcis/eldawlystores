import { describe, it, expect } from "vitest";
import { validateCheckoutItems } from "@/lib/checkout";

describe("inventory validation", () => {
  it("allows order within stock limits", () => {
    const result = validateCheckoutItems([
      { variantId: "var-5", quantity: 5 },
    ]);
    expect(result.valid).toBe(true);
    expect(result.lineItems[0].stock).toBeGreaterThanOrEqual(5);
  });

  it("blocks order exceeding stock", () => {
    const result = validateCheckoutItems([
      { variantId: "var-4", quantity: 100 },
    ]);
    expect(result.valid).toBe(false);
  });

  it("validates multiple line items", () => {
    const result = validateCheckoutItems([
      { variantId: "var-1", quantity: 1 },
      { variantId: "var-5", quantity: 2 },
    ]);
    expect(result.valid).toBe(true);
    expect(result.lineItems).toHaveLength(2);
  });
});
