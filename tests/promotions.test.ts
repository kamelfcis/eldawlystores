import { describe, it, expect } from "vitest";
import { readPromotion } from "@/lib/admin/promotion-fields";
import { filterPromotionsByStatus, promotionStatusLabel } from "@/lib/admin/promotion-status";
import { validatePromoCode } from "@/lib/promotions";

function promoForm(fields: Record<string, string>): FormData {
  const formData = new FormData();
  formData.set("code", "DOLY10");
  formData.set("discount_type", "percentage");
  formData.set("discount_value", "10");
  formData.set("min_order_pounds", "0");
  formData.set("is_active", "true");
  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }
  return formData;
}

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

describe("readPromotion money", () => {
  it("stores a 50 ج.م fixed discount as 5000 piasters", () => {
    const result = readPromotion(
      promoForm({
        code: "SAVE50",
        discount_type: "fixed",
        discount_value: "50",
        min_order_pounds: "0",
      })
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.discountValue).toBe(5000);
  });

  it("stores a 1000 ج.م minimum as 100000 piasters", () => {
    const result = readPromotion(promoForm({ min_order_pounds: "1000" }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.minOrder).toBe(100000);
  });

  it("keeps a percentage value of 10 as 10", () => {
    const result = readPromotion(
      promoForm({
        discount_type: "percentage",
        discount_value: "10",
      })
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.discountValue).toBe(10);
    expect(result.minOrder).toBe(0);
  });

  it("does not treat a leftover percentage as pounds", () => {
    const leftover = readPromotion(
      promoForm({
        discount_type: "percentage",
        discount_value: "10",
        min_order_pounds: "1000",
      })
    );
    expect(leftover.ok).toBe(true);
    if (!leftover.ok) return;
    expect(leftover.discountValue).toBe(10);

    const switched = readPromotion(
      promoForm({
        discount_type: "fixed",
        discount_value: "50",
        min_order_pounds: "1000",
      })
    );
    expect(switched.ok).toBe(true);
    if (!switched.ok) return;
    expect(switched.discountValue).toBe(5000);
  });

  it("reports errors in جنيه or نسبة never قرش", () => {
    const percent = readPromotion(promoForm({ discount_value: "0" }));
    expect(percent.ok).toBe(false);
    if (percent.ok) return;
    expect(percent.error).toContain("النسبة");
    expect(percent.error).not.toContain("قرش");

    const fixed = readPromotion(promoForm({ discount_type: "fixed", discount_value: "abc" }));
    expect(fixed.ok).toBe(false);
    if (fixed.ok) return;
    expect(fixed.error).toContain("جنيه");
    expect(fixed.error).not.toContain("قرش");

    const min = readPromotion(promoForm({ min_order_pounds: "10.999" }));
    expect(min.ok).toBe(false);
    if (min.ok) return;
    expect(min.error).toContain("جنيه");
    expect(min.error).not.toContain("قرش");
  });
});

describe("promotionStatusLabel", () => {
  const now = new Date("2026-10-10T12:00:00.000Z");

  it("returns نشط when active, unexpired, and not exhausted", () => {
    expect(
      promotionStatusLabel(
        { is_active: true, expires_at: "2026-12-31T00:00:00.000Z", max_uses: 100, used_count: 3 },
        now
      )
    ).toBe("نشط");
  });

  it("prefers منتهٍ over معطّل when expired and inactive", () => {
    expect(
      promotionStatusLabel(
        { is_active: false, expires_at: "2026-01-01T00:00:00.000Z", max_uses: null, used_count: 0 },
        now
      )
    ).toBe("منتهٍ");
  });

  it("returns مكتمل when the use cap is reached", () => {
    expect(
      promotionStatusLabel(
        { is_active: true, expires_at: null, max_uses: 10, used_count: 10 },
        now
      )
    ).toBe("مكتمل");
  });

  it("returns معطّل when inactive and not expired", () => {
    expect(
      promotionStatusLabel(
        { is_active: false, expires_at: "2026-12-31T00:00:00.000Z", max_uses: null, used_count: 0 },
        now
      )
    ).toBe("معطّل");
  });

  it("filters the local chips without a second query", () => {
    const rows = [
      { id: "a", is_active: true, expires_at: "2026-12-31T00:00:00.000Z", max_uses: null, used_count: 0 },
      { id: "b", is_active: false, expires_at: "2026-12-31T00:00:00.000Z", max_uses: null, used_count: 0 },
      { id: "c", is_active: true, expires_at: "2026-01-01T00:00:00.000Z", max_uses: null, used_count: 0 },
    ];
    expect(filterPromotionsByStatus(rows, "all", now).map((row) => row.id)).toEqual(["a", "b", "c"]);
    expect(filterPromotionsByStatus(rows, "active", now).map((row) => row.id)).toEqual(["a"]);
    expect(filterPromotionsByStatus(rows, "disabled", now).map((row) => row.id)).toEqual(["b"]);
    expect(filterPromotionsByStatus(rows, "expired", now).map((row) => row.id)).toEqual(["c"]);
  });
});
