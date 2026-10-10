export type PromotionStatusLabel = "نشط" | "منتهٍ" | "مكتمل" | "معطّل";

export type PromotionListFilter = "all" | "active" | "disabled" | "expired";

export interface PromotionStatusFields {
  is_active: boolean;
  expires_at: string | null;
  max_uses: number | null;
  used_count: number;
}

/**
 * Overlap rule — first match wins:
 * 1. expires_at is in the past → منتهٍ (preferred over معطّل when both)
 * 2. max_uses is set and used_count >= max_uses → مكتمل
 * 3. !is_active → معطّل
 * 4. otherwise → نشط
 */
export function promotionStatusLabel(
  promotion: PromotionStatusFields,
  now: Date = new Date()
): PromotionStatusLabel {
  if (promotion.expires_at) {
    const expires = new Date(promotion.expires_at);
    if (!Number.isNaN(expires.getTime()) && expires.getTime() < now.getTime()) {
      return "منتهٍ";
    }
  }

  if (promotion.max_uses != null && promotion.used_count >= promotion.max_uses) {
    return "مكتمل";
  }

  if (!promotion.is_active) return "معطّل";
  return "نشط";
}

export function filterPromotionsByStatus<T extends PromotionStatusFields>(
  promotions: readonly T[],
  filter: PromotionListFilter,
  now: Date = new Date()
): T[] {
  if (filter === "all") return [...promotions];
  const wanted: PromotionStatusLabel =
    filter === "active" ? "نشط" : filter === "disabled" ? "معطّل" : "منتهٍ";
  return promotions.filter((promotion) => promotionStatusLabel(promotion, now) === wanted);
}
