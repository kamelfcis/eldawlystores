"use client";

import Link from "next/link";
import { useOrders } from "@/hooks/use-orders";
import { formatMoney } from "@/lib/money";
import type { OrderStatus } from "@/lib/types/database";

const statusLabels: Record<OrderStatus, string> = {
  pending: "معلق",
  confirmed: "مؤكد",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
  rejected: "مرفوض",
};

export function AccountOrders({ userId }: { userId: string | null }) {
  const { data, isError } = useOrders(userId);
  const orders = data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">طلباتي</h1>
      {isError ? <p className="text-sm text-ember-red">تعذر قراءة الطلبات</p> : null}
      {orders.length === 0 ? (
        <p className="text-graphite text-sm">لا توجد طلبات سابقة. سجّل الدخول بعد إتمام طلب لربطه بحسابك.</p>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li key={order.id} className="border-b border-mist pb-3 text-sm">
              <Link
                href={`/account/orders/${order.id}`}
                className="flex items-center justify-between gap-3 rounded-[4px] px-1 py-1 hover:bg-fog"
              >
                <span className="font-mono text-xs">{order.order_number}</span>
                <span>{statusLabels[order.status]}</span>
                <span>{formatMoney(order.total_piasters)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
