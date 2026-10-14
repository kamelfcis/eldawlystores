import type { OrderStatus } from "@/lib/types/database";

export const validTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled", "rejected"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
  rejected: [],
};

/** Current status first, then unique allowed next statuses. */
export function allowedOrderStatuses(status: OrderStatus): OrderStatus[] {
  const next = validTransitions[status] ?? [];
  return [status, ...next.filter((value) => value !== status)];
}
