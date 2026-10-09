import { mockProducts } from "@/lib/mock-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isServiceRoleConfigured } from "@/lib/supabase/service-role";
import { calculateOrderTotals, formatMoney } from "@/lib/money";
import { validatePromoCode, getShippingRate } from "@/lib/promotions";
import { log, logWarn } from "@/lib/logging";
import { sendOrderEmail, type OrderEmailLine } from "@/lib/email";
import { getOrderStore } from "@/lib/orders";
import type { Json } from "@/lib/types/database";
import { isStoredVariantId } from "./variant-id";
import type { CheckoutInput } from "./schema";

export interface CheckoutResult {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  accessToken?: string;
  error?: string;
}

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DOLY-${ts}-${rand}`;
}

function generateAccessToken(): string {
  return crypto.randomUUID();
}

export interface ValidatedLineItem {
  variantId: string;
  productName: string;
  variantSku: string;
  unitPricePiasters: number;
  quantity: number;
  stock: number;
}

export function validateCheckoutItems(
  items: { variantId: string; quantity: number }[]
): { valid: boolean; lineItems: ValidatedLineItem[]; error?: string } {
  const lineItems: ValidatedLineItem[] = [];

  for (const item of items) {
    let found = false;
    for (const product of mockProducts) {
      const variant = product.variants.find((v) => v.id === item.variantId);
      if (variant) {
        if (variant.stock < item.quantity) {
          return { valid: false, lineItems: [], error: `المخزون غير كافٍ لـ ${product.name_ar}` };
        }
        lineItems.push({
          variantId: variant.id,
          productName: product.name_ar,
          variantSku: variant.sku,
          unitPricePiasters: variant.price_piasters,
          quantity: item.quantity,
          stock: variant.stock,
        });
        found = true;
        break;
      }
    }
    if (!found) {
      return { valid: false, lineItems: [], error: "منتج غير موجود في السلة" };
    }
  }

  return { valid: true, lineItems };
}

function publicCheckoutError(message: string): string {
  const line = message.split("\n")[0]?.trim() ?? "";
  if (/[\u0600-\u06FF]/.test(line)) return line.slice(0, 200);
  return "تعذر إتمام الطلب";
}

async function processCheckoutWithServiceRole(input: CheckoutInput): Promise<CheckoutResult> {
  if (input.items.some((item) => !isStoredVariantId(item.variantId))) {
    return { success: false, error: "منتج غير موجود في السلة" };
  }

  const { createServiceClient } = await import("@/lib/supabase/server");
  const supabase = createServiceClient();
  const items: Json = input.items.map((item) => ({
    variant_id: item.variantId,
    quantity: item.quantity,
  }));

  const { data: shippingRate, error: shippingError } = await supabase
    .from("shipping_rates")
    .select("rate_piasters")
    .eq("governorate", input.governorate)
    .maybeSingle();

  if (shippingError || shippingRate == null) {
    return { success: false, error: "المحافظة غير متاحة" };
  }

  const { data, error } = await supabase.rpc("create_checkout_order", {
    p_customer_name: input.customerName,
    p_customer_email: input.customerEmail,
    p_customer_phone: input.customerPhone,
    p_governorate: input.governorate,
    p_city: input.city,
    p_street: input.street,
    p_building: input.building ?? null,
    p_floor: input.floor ?? null,
    p_promo_code: input.promoCode?.trim() ? input.promoCode.trim() : null,
    p_payment_method: input.paymentMethod,
    p_items: items,
  });

  if (error) {
    return { success: false, error: publicCheckoutError(error.message) };
  }

  const row = data?.[0];
  if (!row) {
    return { success: false, error: "تعذر إتمام الطلب" };
  }

  const { data: saved } = await supabase
    .from("orders")
    .select("total_piasters")
    .eq("id", row.order_id)
    .maybeSingle();

  log("order.created", { orderId: row.order_id, orderNumber: row.order_number });

  const { data: itemRows, error: itemsError } = await supabase
    .from("order_items")
    .select("product_name, quantity, unit_price_piasters")
    .eq("order_id", row.order_id);

  if (itemsError) {
    logWarn("order.items_unread", { orderId: row.order_id });
  }

  const lines: OrderEmailLine[] = (itemRows ?? []).map((item) => ({
    productName: item.product_name,
    quantity: item.quantity,
    lineTotalFormatted: formatMoney(item.unit_price_piasters * item.quantity),
  }));

  const totalFormatted = formatMoney(saved?.total_piasters ?? 0);
  await sendOrderEmail("new-order-admin", {
    orderNumber: row.order_number,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    totalFormatted,
    lines,
  });
  await sendOrderEmail("order-confirmed-customer", {
    orderNumber: row.order_number,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    totalFormatted,
    lines,
  });

  return {
    success: true,
    orderId: row.order_id,
    orderNumber: row.order_number,
    accessToken: row.access_token,
  };
}

async function processMockCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const itemValidation = validateCheckoutItems(input.items);
  if (!itemValidation.valid) {
    return { success: false, error: itemValidation.error };
  }

  const subtotalPiasters = itemValidation.lineItems.reduce(
    (sum, item) => sum + item.unitPricePiasters * item.quantity,
    0
  );

  let discountPiasters = 0;
  if (input.promoCode) {
    const promoResult = validatePromoCode(input.promoCode, subtotalPiasters);
    if (!promoResult.valid) {
      return { success: false, error: promoResult.error };
    }
    discountPiasters = promoResult.discountPiasters;
  }

  const shippingPiasters = getShippingRate(input.governorate);
  if (shippingPiasters == null) {
    return { success: false, error: "المحافظة غير متاحة" };
  }

  const totals = calculateOrderTotals({
    items: itemValidation.lineItems.map((i) => ({ unitPricePiasters: i.unitPricePiasters, quantity: i.quantity })),
    shippingPiasters,
    discountPiasters,
  });

  const orderNumber = generateOrderNumber();
  const accessToken = generateAccessToken();
  const orderId = crypto.randomUUID();

  log("order.created", { orderId, orderNumber, totalPiasters: totals.totalPiasters });

  getOrderStore().set(orderId, {
    id: orderId,
    orderNumber,
    accessToken,
    status: "pending",
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    subtotalPiasters: totals.subtotalPiasters,
    shippingPiasters: totals.shippingPiasters,
    discountPiasters: totals.discountPiasters,
    totalPiasters: totals.totalPiasters,
    governorate: input.governorate,
    createdAt: new Date().toISOString(),
    statusHistory: [{ status: "pending", createdAt: new Date().toISOString() }],
  });

  for (const lineItem of itemValidation.lineItems) {
    for (const product of mockProducts) {
      const variant = product.variants.find((v) => v.id === lineItem.variantId);
      if (variant) {
        variant.stock -= lineItem.quantity;
      }
    }
  }

  const totalFormatted = formatMoney(totals.totalPiasters);
  const lines: OrderEmailLine[] = itemValidation.lineItems.map((item) => ({
    productName: item.productName,
    quantity: item.quantity,
    lineTotalFormatted: formatMoney(item.unitPricePiasters * item.quantity),
  }));

  await sendOrderEmail("new-order-admin", {
    orderNumber,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    totalFormatted,
    lines,
  });

  await sendOrderEmail("order-confirmed-customer", {
    orderNumber,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    totalFormatted,
    lines,
  });

  return { success: true, orderId, orderNumber, accessToken };
}

export async function processCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  if (getShippingRate(input.governorate) == null) {
    return { success: false, error: "المحافظة غير متاحة" };
  }

  if (isServiceRoleConfigured()) {
    return processCheckoutWithServiceRole(input);
  }

  if (isSupabaseConfigured()) {
    return {
      success: false,
      error: "إتمام الطلب غير متاح — مفتاح الخدمة في Supabase غير مُعد",
    };
  }

  return processMockCheckout(input);
}
