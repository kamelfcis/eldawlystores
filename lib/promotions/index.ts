import { mockPromotions, mockShippingRates } from "@/lib/mock-data";

export interface PromoValidationResult {
  valid: boolean;
  discountPiasters: number;
  error?: string;
}

export function validatePromoCode(
  code: string,
  subtotalPiasters: number
): PromoValidationResult {
  const promo = mockPromotions.find(
    (p) => p.code.toUpperCase() === code.toUpperCase() && p.is_active
  );

  if (!promo) {
    return { valid: false, discountPiasters: 0, error: "كود الخصم غير صالح" };
  }

  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return { valid: false, discountPiasters: 0, error: "انتهت صلاحية كود الخصم" };
  }

  if (promo.max_uses && promo.used_count >= promo.max_uses) {
    return { valid: false, discountPiasters: 0, error: "تم استخدام كود الخصم بالكامل" };
  }

  if (subtotalPiasters < promo.min_order_piasters) {
    return {
      valid: false,
      discountPiasters: 0,
      error: `الحد الأدنى للطلب ${promo.min_order_piasters / 100} ج.م`,
    };
  }

  let discountPiasters = 0;
  if (promo.discount_type === "percentage") {
    discountPiasters = Math.round(subtotalPiasters * (promo.discount_value / 100));
  } else {
    discountPiasters = promo.discount_value;
  }

  return { valid: true, discountPiasters: Math.min(discountPiasters, subtotalPiasters) };
}

export function getShippingRate(governorate: string): number {
  const rate = mockShippingRates.find((r) => r.governorate === governorate);
  return rate?.rate_piasters ?? 10000;
}

export function getGovernorates(): string[] {
  return mockShippingRates.map((r) => r.governorate);
}
