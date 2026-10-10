"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ReorderButton } from "@/components/account/reorder-button";
import { OrderStatusChip } from "@/components/account/order-status-chip";
import { useOrders } from "@/hooks/use-orders";
import { formatMoney } from "@/lib/money";

const ORDERS_ERROR = "تعذر قراءة الطلبات";

function formatOrderDate(value: string): string {
  return new Date(value).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function AccountOrders({ userId }: { userId: string | null }) {
  const router = useRouter();
  const { data, isError, isLoading } = useOrders(userId);
  const orders = data ?? [];

  useEffect(() => {
    if (!userId) {
      router.replace("/account/login");
    }
  }, [userId, router]);

  if (!userId) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-retail-ink">طلباتي</h1>

      {isError ? <p className="text-sm text-ember-red">{ORDERS_ERROR}</p> : null}

      {!isError && !isLoading && orders.length === 0 ? (
        <div className="rounded-[8px] border border-retail-line bg-paper-white p-6 text-center">
          <p className="text-[14px] text-graphite">
            لا توجد طلبات على هذا الحساب. أكمل طلباً وأنت مسجّل الدخول لعرضه هنا.
          </p>
          <Button asChild variant="retail" className="mt-4 h-10 min-h-10">
            <Link href="/products">تصفح المنتجات</Link>
          </Button>
        </div>
      ) : null}

      {orders.length > 0 ? (
        <ul className="space-y-3">
          {orders.map((order, index) => (
            <li
              key={order.id}
              className="rounded-[8px] border border-retail-line bg-paper-white p-4"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span dir="ltr" className="font-mono text-[13px] text-retail-ink">
                      {order.order_number}
                    </span>
                    {index === 0 ? (
                      <span className="inline-flex min-h-6 items-center rounded-full border border-retail-line bg-fog px-2.5 text-[12px] font-bold text-retail-ink">
                        آخر طلب
                      </span>
                    ) : null}
                    <OrderStatusChip status={order.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px]">
                    <span className="font-bold text-retail-red">{formatMoney(order.total_piasters)}</span>
                    <time className="text-graphite" dateTime={order.created_at}>
                      {formatOrderDate(order.created_at)}
                    </time>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                  <Button asChild variant="outline" className="h-10 min-h-10 w-full sm:w-auto">
                    <Link href={`/account/orders/${order.id}`}>تفاصيل</Link>
                  </Button>
                  <ReorderButton orderId={order.id} className="w-full sm:w-auto" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
