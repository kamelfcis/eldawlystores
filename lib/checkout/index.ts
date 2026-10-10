import type { SupabaseClient } from "@supabase/supabase-js";
import { mockProducts } from "@/lib/mock-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isServiceRoleConfigured } from "@/lib/supabase/service-role";
import { calculateOrderTotals, formatMoney } from "@/lib/money";
import { validatePromoCode, getShippingRate } from "@/lib/promotions";
import { log, logWarn } from "@/lib/logging";
import {
  resolveEmailImageUrl,
  sendOrderEmail,
  type OrderEmailAddress,
  type OrderEmailData,
  type OrderEmailLine,
} from "@/lib/email";
import { getOrderStore } from "@/lib/orders";
import type { Database, Json } from "@/lib/types/database";
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

function addressFromParts(parts: {
  governorate?: string | null;
  city?: string | null;
  street?: string | null;
  building?: string | null;
  floor?: string | null;
}): OrderEmailAddress | undefined {
  const text = (value: string | null | undefined) => value?.trim() ?? "";
  const governorate = text(parts.governorate);
  const city = text(parts.city);
  const street = text(parts.street);
  const building = text(parts.building);
  const floor = text(parts.floor);
  if (!governorate && !city && !street && !building && !floor) return undefined;
  return {
    ...(governorate ? { governorate } : {}),
    ...(city ? { city } : {}),
    ...(street ? { street } : {}),
    ...(building ? { building } : {}),
    ...(floor ? { floor } : {}),
  };
}

function shippingAddressFromJson(value: Json | null | undefined): OrderEmailAddress | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, Json | undefined>;
  const text = (key: string) => (typeof record[key] === "string" ? record[key] : "");
  return addressFromParts({
    governorate: text("governorate"),
    city: text("city"),
    street: text("street"),
    building: text("building"),
    floor: text("floor"),
  });
}

async function loadVariantImageUrls(
  supabase: SupabaseClient<Database>,
  variantIds: string[]
): Promise<Map<string, string>> {
  const images = new Map<string, string>();
  const ids = [...new Set(variantIds.filter((id) => id.length > 0))];
  if (ids.length === 0) return images;

  const { data: variants, error: variantsError } = await supabase
    .from("product_variants")
    .select("id, product_id")
    .in("id", ids);
  if (variantsError || !variants?.length) return images;

  const productIds = [...new Set(variants.map((variant) => variant.product_id))];
  const { data: productImages, error: imagesError } = await supabase
    .from("product_images")
    .select("product_id, url, sort_order")
    .in("product_id", productIds)
    .order("sort_order", { ascending: true });
  if (imagesError || !productImages) return images;

  const firstByProduct = new Map<string, string | undefined>();
  const ranked = [...productImages].sort((a, b) => a.sort_order - b.sort_order);
  for (const image of ranked) {
    if (firstByProduct.has(image.product_id)) continue;
    firstByProduct.set(image.product_id, resolveEmailImageUrl(image.url));
  }

  for (const variant of variants) {
    const url = firstByProduct.get(variant.product_id);
    if (url) images.set(variant.id, url);
  }
  return images;
}

async function deliverCheckoutEmails(data: OrderEmailData, orderId: string): Promise<void> {
  try {
    await sendOrderEmail("new-order-admin", data);
    await sendOrderEmail("order-confirmed-customer", data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logWarn("email.failed", { orderId, error: message });
  }
}

async function processCheckoutWithServiceRole(
  input: CheckoutInput,
  userId: string | null
): Promise<CheckoutResult> {
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
    p_user_id: userId,
  });

  if (error) {
    return { success: false, error: publicCheckoutError(error.message) };
  }

  const row = data?.[0];
  if (!row) {
    return { success: false, error: "تعذر إتمام الطلب" };
  }

  const [{ data: saved }, itemsResult] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "subtotal_piasters, shipping_piasters, discount_piasters, total_piasters, payment_method, status, customer_name, customer_email, customer_phone, shipping_address"
      )
      .eq("id", row.order_id)
      .maybeSingle(),
    supabase
      .from("order_items")
      .select("variant_id, product_name, variant_sku, unit_price_piasters, quantity")
      .eq("order_id", row.order_id),
  ]);

  log("order.created", { orderId: row.order_id, orderNumber: row.order_number });

  const itemRows = itemsResult.error ? null : itemsResult.data;
  if (itemsResult.error) {
    logWarn("order.items_unread", { orderId: row.order_id });
  }

  const imageByVariant = itemRows
    ? await loadVariantImageUrls(
        supabase,
        itemRows.map((item) => item.variant_id)
      )
    : new Map<string, string>();

  const lines: OrderEmailLine[] = (itemRows ?? []).map((item) => {
    const imageUrl = imageByVariant.get(item.variant_id);
    return {
      productName: item.product_name,
      sku: item.variant_sku,
      quantity: item.quantity,
      unitPriceFormatted: formatMoney(item.unit_price_piasters),
      lineTotalFormatted: formatMoney(item.unit_price_piasters * item.quantity),
      ...(imageUrl ? { imageUrl } : {}),
    };
  });

  const emailData: OrderEmailData = {
    orderNumber: row.order_number,
    customerName: saved?.customer_name ?? input.customerName,
    customerEmail: saved?.customer_email ?? input.customerEmail,
    customerPhone: saved?.customer_phone ?? input.customerPhone,
    shippingAddress: saved
      ? shippingAddressFromJson(saved.shipping_address)
      : addressFromParts(input),
    paymentMethod: saved?.payment_method ?? input.paymentMethod,
    status: saved?.status ?? "pending",
    subtotalFormatted: formatMoney(saved?.subtotal_piasters ?? 0),
    shippingFormatted: formatMoney(saved?.shipping_piasters ?? 0),
    discountFormatted: formatMoney(saved?.discount_piasters ?? 0),
    totalFormatted: formatMoney(saved?.total_piasters ?? 0),
    lines,
  };
  await deliverCheckoutEmails(emailData, row.order_id);

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

  const lines: OrderEmailLine[] = itemValidation.lineItems.map((item) => ({
    productName: item.productName,
    sku: item.variantSku,
    quantity: item.quantity,
    unitPriceFormatted: formatMoney(item.unitPricePiasters),
    lineTotalFormatted: formatMoney(item.unitPricePiasters * item.quantity),
  }));

  await deliverCheckoutEmails(
    {
      orderNumber,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      shippingAddress: addressFromParts(input),
      paymentMethod: input.paymentMethod,
      status: "pending",
      subtotalFormatted: formatMoney(totals.subtotalPiasters),
      shippingFormatted: formatMoney(totals.shippingPiasters),
      discountFormatted: formatMoney(totals.discountPiasters),
      totalFormatted: formatMoney(totals.totalPiasters),
      lines,
    },
    orderId
  );

  return { success: true, orderId, orderNumber, accessToken };
}

export async function processCheckout(
  input: CheckoutInput,
  userId: string | null = null
): Promise<CheckoutResult> {
  if (getShippingRate(input.governorate) == null) {
    return { success: false, error: "المحافظة غير متاحة" };
  }

  if (isServiceRoleConfigured()) {
    return processCheckoutWithServiceRole(input, userId);
  }

  if (isSupabaseConfigured()) {
    return {
      success: false,
      error: "إتمام الطلب غير متاح — مفتاح الخدمة في Supabase غير مُعد",
    };
  }

  return processMockCheckout(input);
}
