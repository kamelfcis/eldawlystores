import { poundsToPiasters } from "@/lib/money";

export type ReadPromotionResult =
  | { ok: false; error: string }
  | {
      ok: true;
      code: string;
      discountType: "percentage" | "fixed";
      discountValue: number;
      minOrder: number;
      maxUses: number | null;
      isActive: boolean;
      expiresAt: string | null;
    };

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readInt(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) return null;
  return parsed;
}

function readPoundsToPiasters(value: string): number | null {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return null;
  const pounds = Number(value);
  if (!Number.isFinite(pounds) || pounds < 0) return null;
  const piasters = poundsToPiasters(pounds);
  if (!Number.isSafeInteger(piasters)) return null;
  return piasters;
}

export function readPromotion(formData: FormData): ReadPromotionResult {
  const code = readString(formData, "code").toUpperCase();
  const discountType = readString(formData, "discount_type");
  const discountRaw = readString(formData, "discount_value");
  const minRaw = readString(formData, "min_order_pounds") || "0";
  const maxUsesRaw = readString(formData, "max_uses");
  const maxUses = maxUsesRaw === "" ? null : readInt(maxUsesRaw);
  const isActive = formData.get("is_active") === "on" || formData.get("is_active") === "true";
  const expiresRaw = readString(formData, "expires_at");

  if (code.length < 2 || code.length > 40 || /\s/.test(code)) return { ok: false, error: "كود العرض غير صالح" };
  if (discountType !== "percentage" && discountType !== "fixed") return { ok: false, error: "نوع الخصم غير صالح" };

  let discountValue: number | null;
  if (discountType === "percentage") {
    discountValue = readInt(discountRaw);
    if (discountValue == null || discountValue <= 0) {
      return { ok: false, error: "النسبة يجب أن تكون رقماً صحيحاً أكبر من صفر" };
    }
    if (discountValue > 100) return { ok: false, error: "النسبة يجب ألا تتجاوز 100" };
  } else {
    discountValue = readPoundsToPiasters(discountRaw);
    if (discountValue == null || discountValue <= 0) {
      return { ok: false, error: "قيمة الخصم بالجنيه يجب أن تكون رقماً أكبر من صفر" };
    }
  }

  const minOrder = readPoundsToPiasters(minRaw);
  if (minOrder == null) return { ok: false, error: "الحد الأدنى بالجنيه غير صالح" };
  if (maxUsesRaw !== "" && (maxUses == null || maxUses <= 0)) return { ok: false, error: "الحد الأقصى للاستخدام غير صالح" };

  let expiresAt: string | null = null;
  if (expiresRaw) {
    const parsed = new Date(expiresRaw);
    if (Number.isNaN(parsed.getTime())) return { ok: false, error: "تاريخ الانتهاء غير صالح" };
    expiresAt = parsed.toISOString();
  }

  return { ok: true, code, discountType, discountValue, minOrder, maxUses, isActive, expiresAt };
}
