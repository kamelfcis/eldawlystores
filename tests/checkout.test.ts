import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { validateCheckoutItems } from "@/lib/checkout";
import { reviewCheckoutTotals } from "@/lib/checkout/review";
import { isStoredVariantId } from "@/lib/checkout/variant-id";
import { checkoutSchema } from "@/lib/checkout/schema";
import { isCheckoutSuccess } from "@/lib/checkout/success";
import { formatMoney } from "@/lib/money";
import { getGovernorates, getShippingRate } from "@/lib/promotions";

const checkoutDraft = {
  customerName: "عميل تجريبي",
  customerEmail: "buyer@example.com",
  customerPhone: "01000000000",
  city: "مدينة",
  street: "شارع",
  paymentMethod: "cod" as const,
  items: [{ variantId: "var-1", quantity: 1 }],
};

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

describe("checkout governorates", () => {
  it("accepts all 27 governorates and rejects empty or unknown names", () => {
    expect(getGovernorates()).toHaveLength(27);
    for (const governorate of getGovernorates()) {
      expect(checkoutSchema.safeParse({ ...checkoutDraft, governorate }).success).toBe(true);
    }
    expect(checkoutSchema.safeParse({ ...checkoutDraft, governorate: "" }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...checkoutDraft, governorate: "المنصورة" }).success).toBe(false);
  });

  it("shows Cairo shipping as formatMoney(5000) and does not invent a rate", () => {
    expect(getShippingRate("القاهرة")).toBe(5000);
    expect(formatMoney(getShippingRate("القاهرة") ?? 0)).toBe(formatMoney(5000));
    expect(getShippingRate("الإسكندرية")).toBe(7000);
    expect(getShippingRate("القليوبية")).toBe(7000);
    expect(getShippingRate("أسوان")).toBe(8000);
    expect(getShippingRate("المنصورة")).toBeNull();
    expect(getShippingRate("المنصورة")).not.toBe(10000);
  });

  it("keeps the checkout function on gen_random_uuid and the in-function shipping fallback", () => {
    const sql = readFileSync(
      "supabase/migrations/20261009111500_checkout_order_gen_random_uuid.sql",
      "utf8"
    );
    expect(sql).toContain("gen_random_uuid()");
    expect(sql).not.toContain("uuid_generate_v4");
    expect(sql).toContain("v_shipping := 10000");
  });

  it("rejects a stored variant id that is not a uuid", () => {
    expect(isStoredVariantId("8ee7f66c-5b86-4b18-adae-f031da9a0e23")).toBe(true);
    expect(isStoredVariantId("var-1")).toBe(false);
    expect(isStoredVariantId("")).toBe(false);
  });

  it("adds the selected shipping rate to the subtotal and omits a missing rate", () => {
    expect(reviewCheckoutTotals(100000, 5000)).toEqual({
      subtotalPiasters: 100000,
      shippingPiasters: 5000,
      orderTotalPiasters: 105000,
    });
    const missing = reviewCheckoutTotals(100000, null);
    expect(missing.shippingPiasters).toBeNull();
    expect(missing.orderTotalPiasters).toBeNull();
    expect(missing.orderTotalPiasters).not.toBe(110000);
  });

  it("does not treat a checkout response without an access token as success", () => {
    expect(isCheckoutSuccess({})).toBe(false);
    expect(isCheckoutSuccess({ accessToken: "" })).toBe(false);
    expect(isCheckoutSuccess({ accessToken: "order-token" })).toBe(true);
  });

  it("persists logged-in checkout user_id via p_user_id on create_checkout_order", () => {
    const sql = readFileSync(
      "supabase/migrations/20261010120000_checkout_user_id_and_link_orders.sql",
      "utf8"
    );
    expect(sql).toContain("p_user_id uuid DEFAULT NULL");
    expect(sql).toMatch(/INSERT INTO public\.orders[\s\S]*user_id[\s\S]*p_user_id/);
    const checkoutFn = sql.split("CREATE OR REPLACE FUNCTION public.link_guest_orders_to_user")[0] ?? "";
    expect(checkoutFn).not.toContain("auth.uid()");
  });

  it("links only guest orders with a matching email through link_guest_orders_to_user", () => {
    const sql = readFileSync(
      "supabase/migrations/20261010120000_checkout_user_id_and_link_orders.sql",
      "utf8"
    );
    expect(sql).toContain("link_guest_orders_to_user");
    expect(sql).toContain("WHERE user_id IS NULL");
    expect(sql).toContain("lower(btrim(customer_email)) = lower(btrim(v_email))");
    expect(sql).toContain("GRANT EXECUTE ON FUNCTION public.link_guest_orders_to_user() TO authenticated");
    expect(sql).not.toContain("GRANT EXECUTE ON FUNCTION public.link_guest_orders_to_user() TO anon");
  });
});
