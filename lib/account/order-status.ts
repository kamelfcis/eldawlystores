import type { OrderStatus } from "@/lib/types/database";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
  rejected: "مرفوض",
};
