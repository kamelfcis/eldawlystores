import { arabicDbError } from "@/lib/admin/errors";
import type { Json, OrderStatus } from "@/lib/types/database";
import { sendOrderEmail } from "@/lib/email";
import { formatMoney } from "@/lib/money";
import { log } from "@/lib/logging";
import { isServiceRoleConfigured } from "@/lib/supabase/service-role";
import {
  bucketOrdersByDay,
  cairoMidnightIso,
  emptyDaySeries,
  lastCairoDays,
  nextCivilDate,
  TREND_DAY_COUNT,
  type AdminDayPoint,
  type TrendOrderRow,
} from "@/lib/orders/trends";

export type { AdminDayPoint } from "@/lib/orders/trends";

export interface OrderRecord {
  id: string;
  orderNumber: string;
  accessToken: string;
  status: OrderStatus;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  subtotalPiasters: number;
  shippingPiasters: number;
  discountPiasters: number;
  totalPiasters: number;
  governorate: string;
  createdAt: string;
  statusHistory: { status: OrderStatus; createdAt: string; note?: string }[];
}

const orderStore = new Map<string, OrderRecord>();

export function getOrderStore(): Map<string, OrderRecord> {
  return orderStore;
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  note?: string
): Promise<{ success: boolean; error?: string }> {
  const order = orderStore.get(orderId);
  if (!order) return { success: false, error: "الطلب غير موجود" };

  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    pending: ["confirmed", "cancelled", "rejected"],
    confirmed: ["shipped", "cancelled"],
    shipped: ["delivered", "cancelled"],
    delivered: [],
    cancelled: [],
    rejected: [],
  };

  if (!validTransitions[order.status].includes(newStatus)) {
    return { success: false, error: "انتقال الحالة غير مسموح" };
  }

  order.status = newStatus;
  order.statusHistory.push({ status: newStatus, createdAt: new Date().toISOString(), note });
  orderStore.set(orderId, order);

  log("order.status_changed", { orderId, status: newStatus });

  const emailMap: Partial<Record<OrderStatus, "order-shipped" | "order-delivered" | "order-cancelled">> = {
    shipped: "order-shipped",
    delivered: "order-delivered",
    cancelled: "order-cancelled",
    rejected: "order-cancelled",
  };

  const template = emailMap[newStatus];
  if (template) {
    await sendOrderEmail(template, {
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      totalFormatted: formatMoney(order.totalPiasters),
      status: newStatus,
    });
  }

  return { success: true };
}

export interface GuestOrderItem {
  id: string;
  product_name: string;
  variant_sku: string;
  unit_price_piasters: number;
  quantity: number;
}

export interface GuestOrder {
  id: string;
  order_number: string;
  status: OrderStatus;
  customer_name: string;
  subtotal_piasters: number;
  shipping_piasters: number;
  discount_piasters: number;
  total_piasters: number;
  created_at: string;
  order_items: GuestOrderItem[];
}

export type GuestOrderLookup =
  | { status: "found"; order: GuestOrder }
  | { status: "not-configured" }
  | { status: "missing" };

export async function getOrderByAccessToken(token: string): Promise<GuestOrderLookup> {
  if (!isServiceRoleConfigured()) return { status: "not-configured" };

  const { createServiceClient } = await import("@/lib/supabase/server");
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, customer_name, subtotal_piasters, shipping_piasters, discount_piasters, total_piasters, created_at, order_items(id, product_name, variant_sku, unit_price_piasters, quantity)"
    )
    .eq("access_token", token)
    .maybeSingle();

  if (error || !data) return { status: "missing" };

  const items = data.order_items;
  const orderItems = Array.isArray(items) ? items : items ? [items] : [];

  return {
    status: "found",
    order: {
      id: data.id,
      order_number: data.order_number,
      status: data.status,
      customer_name: data.customer_name,
      subtotal_piasters: data.subtotal_piasters,
      shipping_piasters: data.shipping_piasters,
      discount_piasters: data.discount_piasters,
      total_piasters: data.total_piasters,
      created_at: data.created_at,
      order_items: orderItems,
    },
  };
}

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
  "rejected",
] as const satisfies readonly OrderStatus[];

const REVENUE_EXCLUDED_STATUSES: OrderStatus[] = ["cancelled", "rejected"];

const validTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled", "rejected"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
  rejected: [],
};

export interface AdminOrderListItem {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  status: OrderStatus;
  totalPiasters: number;
  createdAt: string;
}

export interface AdminOrderItem {
  id: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPricePiasters: number;
}

export interface AdminOrderHistoryEntry {
  id: string;
  status: OrderStatus;
  note: string | null;
  createdAt: string;
}

export interface AdminOrderDetail {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  status: OrderStatus;
  subtotalPiasters: number;
  shippingPiasters: number;
  discountPiasters: number;
  totalPiasters: number;
  createdAt: string;
  addressLines: string[];
  items: AdminOrderItem[];
  history: AdminOrderHistoryEntry[];
}

export interface AdminMetrics {
  totalOrders: number;
  ordersToday: number;
  byStatus: Record<OrderStatus, number>;
  revenuePiasters: number;
  averageOrderPiasters: number;
  lowStockCount: number;
  lowStock: { id: string; productId: string; sku: string; stock: number; product: string }[];
  error: string | null;
}

function emptyStatusCounts(): Record<OrderStatus, number> {
  return {
    pending: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    rejected: 0,
  };
}

function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

function joinErrors(messages: Array<string | null | undefined>): string | null {
  const unique = [...new Set(messages.filter((message): message is string => Boolean(message)))];
  return unique.length > 0 ? unique.join(" ") : null;
}

function cairoDayStartIso(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return `${parts}T00:00:00+03:00`;
}

function addressLines(value: Json): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const row = value as Record<string, Json | undefined>;
  const fields: Array<[string, string]> = [
    ["governorate", "المحافظة"],
    ["city", "المدينة"],
    ["area", "المنطقة"],
    ["street", "الشارع"],
    ["building", "المبنى"],
    ["floor", "الدور"],
    ["phone", "الهاتف"],
  ];
  return fields.flatMap(([key, label]) => {
    const entry = row[key];
    return typeof entry === "string" && entry.trim() ? [`${label}: ${entry.trim()}`] : [];
  });
}

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const { assertAdmin } = await import("@/lib/auth");
  const { createClient } = await import("@/lib/supabase/server");
  const { getLowStock } = await import("@/lib/admin/queries");
  await assertAdmin();
  const supabase = await createClient();

  const statusQueries = ORDER_STATUSES.map((status) =>
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", status)
  );

  const [totalResult, todayResult, ...statusResults] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", cairoDayStartIso()),
    ...statusQueries,
  ]);

  const byStatus = emptyStatusCounts();
  ORDER_STATUSES.forEach((status, index) => {
    const result = statusResults[index];
    if (!result?.error) byStatus[status] = result?.count ?? 0;
  });

  const revenue = await sumIncludedRevenue(supabase);
  const lowStock = await getLowStock();
  const includedCount = revenue.count;
  const averageOrderPiasters =
    revenue.error || includedCount === 0 ? 0 : Math.round(revenue.revenue / includedCount);

  return {
    totalOrders: totalResult.error ? 0 : (totalResult.count ?? 0),
    ordersToday: todayResult.error ? 0 : (todayResult.count ?? 0),
    byStatus,
    revenuePiasters: revenue.error ? 0 : revenue.revenue,
    averageOrderPiasters,
    lowStockCount: lowStock.error ? 0 : lowStock.count,
    lowStock: lowStock.error ? [] : lowStock.items,
    error: joinErrors([
      arabicDbError(totalResult.error),
      arabicDbError(todayResult.error),
      ...statusResults.map((result) => arabicDbError(result.error)),
      revenue.error ? arabicDbError({ message: revenue.error }) : null,
      lowStock.error,
    ]),
  };
}

export async function getAdminDailyTrend(now = new Date()): Promise<{ days: AdminDayPoint[]; error: string | null }> {
  const { assertAdmin } = await import("@/lib/auth");
  const { createClient } = await import("@/lib/supabase/server");
  await assertAdmin();
  const supabase = await createClient();
  const keys = lastCairoDays(TREND_DAY_COUNT, now);
  const start = cairoMidnightIso(keys[0]);
  const end = cairoMidnightIso(nextCivilDate(keys[keys.length - 1]));
  const pageSize = 1000;
  const rows: TrendOrderRow[] = [];
  let from = 0;

  while (from <= 100_000) {
    const { data, error } = await supabase
      .from("orders")
      .select("created_at, status, total_piasters")
      .gte("created_at", start)
      .lt("created_at", end)
      .order("created_at", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) return { days: emptyDaySeries(now), error: arabicDbError(error) };

    const batch = data ?? [];
    for (const row of batch) {
      if (typeof row.total_piasters !== "number" || !Number.isInteger(row.total_piasters)) {
        return { days: emptyDaySeries(now), error: "قيمة طلب غير صالحة" };
      }
      rows.push({
        createdAt: row.created_at,
        status: row.status,
        totalPiasters: row.total_piasters,
      });
    }

    if (batch.length < pageSize) return { days: bucketOrdersByDay(rows, now), error: null };
    from += pageSize;
  }

  return { days: emptyDaySeries(now), error: "تعذر إكمال قراءة الطلبات" };
}

async function sumIncludedRevenue(supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>) {
  const pageSize = 1000;
  let from = 0;
  let revenue = 0;
  let count = 0;

  while (from <= 100_000) {
    const { data, error } = await supabase
      .from("orders")
      .select("total_piasters")
      .not("status", "in", `(${REVENUE_EXCLUDED_STATUSES.join(",")})`)
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) return { revenue: 0, count: 0, error: arabicDbError(error) ?? "تعذر إكمال العملية" };

    const batch = data ?? [];
    for (const row of batch) {
      if (typeof row.total_piasters !== "number" || !Number.isFinite(row.total_piasters)) {
        return { revenue: 0, count: 0, error: "قيمة طلب غير صالحة" };
      }
      revenue += row.total_piasters;
      count += 1;
    }

    if (batch.length < pageSize) return { revenue, count, error: null };
    from += pageSize;
  }

  return { revenue: 0, count: 0, error: "تعذر إكمال حساب الإيرادات" };
}

export async function listAdminOrders(options?: {
  status?: OrderStatus;
  limit?: number;
}): Promise<{ orders: AdminOrderListItem[]; error: string | null }> {
  const { assertAdmin } = await import("@/lib/auth");
  const { createClient } = await import("@/lib/supabase/server");
  await assertAdmin();
  const supabase = await createClient();
  const pageSize = Math.min(options?.limit ?? 1000, 1000);
  const orders: AdminOrderListItem[] = [];
  let from = 0;
  const cap = options?.limit ?? 100_000;

  while (orders.length < cap && from <= 100_000) {
    let query = supabase
      .from("orders")
      .select("id, order_number, customer_name, customer_phone, status, total_piasters, created_at")
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);
    if (options?.status) query = query.eq("status", options.status);

    const { data, error } = await query;
    if (error) return { orders: [], error: arabicDbError(error) };

    const batch = data ?? [];
    for (const row of batch) {
      if (!isOrderStatus(row.status)) return { orders: [], error: "حالة طلب غير معروفة" };
      orders.push({
        id: row.id,
        orderNumber: row.order_number,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        status: row.status,
        totalPiasters: row.total_piasters,
        createdAt: row.created_at,
      });
      if (orders.length >= cap) return { orders, error: null };
    }

    if (batch.length < pageSize) return { orders, error: null };
    from += pageSize;
  }

  return { orders: [], error: "تعذر إكمال قراءة الطلبات" };
}

export async function getAdminOrder(orderId: string): Promise<{ order: AdminOrderDetail | null; error: string | null }> {
  const { assertAdmin } = await import("@/lib/auth");
  const { createClient } = await import("@/lib/supabase/server");
  await assertAdmin();
  const supabase = await createClient();

  const [orderResult, itemsResult, historyResult] = await Promise.all([
    supabase
      .from("orders")
      .select("id, order_number, customer_name, customer_phone, customer_email, status, subtotal_piasters, shipping_piasters, discount_piasters, total_piasters, shipping_address, created_at")
      .eq("id", orderId)
      .maybeSingle(),
    supabase
      .from("order_items")
      .select("id, product_name, variant_sku, quantity, unit_price_piasters")
      .eq("order_id", orderId),
    supabase
      .from("order_status_history")
      .select("id, status, note, created_at")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true }),
  ]);

  const error = arabicDbError(orderResult.error) ?? arabicDbError(itemsResult.error) ?? arabicDbError(historyResult.error);
  if (error || !orderResult.data || !isOrderStatus(orderResult.data.status)) {
    return { order: null, error: error ?? (orderResult.data ? "حالة طلب غير معروفة" : null) };
  }

  const order = orderResult.data;
  const history = (historyResult.data ?? []).flatMap((entry) => {
    if (!isOrderStatus(entry.status)) return [];
    return [{ id: entry.id, status: entry.status, note: entry.note, createdAt: entry.created_at }];
  });

  return {
    order: {
      id: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      customerEmail: order.customer_email,
      status: order.status,
      subtotalPiasters: order.subtotal_piasters,
      shippingPiasters: order.shipping_piasters,
      discountPiasters: order.discount_piasters,
      totalPiasters: order.total_piasters,
      createdAt: order.created_at,
      addressLines: addressLines(order.shipping_address),
      items: (itemsResult.data ?? []).map((item) => ({
        id: item.id,
        productName: item.product_name,
        sku: item.variant_sku,
        quantity: item.quantity,
        unitPricePiasters: item.unit_price_piasters,
      })),
      history,
    },
    error: null,
  };
}

export async function updateAdminOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  note?: string
): Promise<{ success: boolean; error?: string }> {
  const { assertAdmin } = await import("@/lib/auth");
  const { createClient } = await import("@/lib/supabase/server");
  const { userId } = await assertAdmin();
  const supabase = await createClient();

  const { data: order, error: readError } = await supabase
    .from("orders")
    .select("id, order_number, status, customer_name, customer_email, total_piasters, updated_at")
    .eq("id", orderId)
    .maybeSingle();

  if (readError) return { success: false, error: "تعذر قراءة الطلب" };
  if (!order || !isOrderStatus(order.status)) return { success: false, error: "الطلب غير موجود" };
  if (!validTransitions[order.status].includes(newStatus)) {
    return { success: false, error: "انتقال الحالة غير مسموح" };
  }

  const updatedAt = new Date().toISOString();
  const { data: updated, error: updateError } = await supabase
    .from("orders")
    .update({ status: newStatus, updated_at: updatedAt })
    .eq("id", orderId)
    .eq("status", order.status)
    .select("id")
    .maybeSingle();

  if (updateError || !updated) return { success: false, error: "تعذر تحديث الحالة" };

  const { error: historyError } = await supabase.from("order_status_history").insert({
    order_id: orderId,
    status: newStatus,
    note: note?.trim() ? note.trim() : null,
    changed_by: userId,
  });

  if (historyError) {
    await supabase
      .from("orders")
      .update({ status: order.status, updated_at: order.updated_at })
      .eq("id", orderId);
    return { success: false, error: "تعذر حفظ سجل الحالة" };
  }

  log("order.status_changed", { orderId, status: newStatus });

  const emailMap: Partial<Record<OrderStatus, "order-shipped" | "order-delivered" | "order-cancelled">> = {
    shipped: "order-shipped",
    delivered: "order-delivered",
    cancelled: "order-cancelled",
    rejected: "order-cancelled",
  };

  const template = emailMap[newStatus];
  if (template) {
    await sendOrderEmail(template, {
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      totalFormatted: formatMoney(order.total_piasters),
      status: newStatus,
    });
  }

  return { success: true };
}
