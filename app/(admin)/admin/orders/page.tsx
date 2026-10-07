import Link from "next/link";
import { AdminEmpty, AdminError, AdminPage, StatusPill, formatAdminTime } from "@/components/admin/admin-ui";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { ORDER_STATUSES, listAdminOrders } from "@/lib/orders";
import type { OrderStatus } from "@/lib/types/database";

export const metadata = { title: "إدارة الطلبات" };

const statusLabels: Record<OrderStatus, string> = {
  pending: "معلق",
  confirmed: "مؤكد",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
  rejected: "مرفوض",
};

function isStatus(value: string | undefined): value is OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus);
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = isStatus(params.status) ? params.status : undefined;
  const { orders, error } = await listAdminOrders(status ? { status } : undefined);

  return (
    <AdminPage
      title="الطلبات"
      action={
        <Button asChild size="sm" variant="outline">
          <a href="/api/admin/export?resource=orders">تصدير Excel</a>
        </Button>
      }
    >
      <AdminError message={error} />
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/orders" className={`rounded-[4px] px-3 py-2 text-[14px] ${status ? "text-graphite" : "bg-fog text-carbon-ink"}`}>
          الكل
        </Link>
        {ORDER_STATUSES.map((value) => (
          <Link
            key={value}
            href={`/admin/orders?status=${value}`}
            className={`rounded-[4px] px-3 py-2 text-[14px] ${status === value ? "bg-fog text-carbon-ink" : "text-graphite"}`}
          >
            {statusLabels[value]}
          </Link>
        ))}
      </div>
      {orders.length === 0 ? (
        <AdminEmpty>{status ? "لا توجد طلبات بهذه الحالة." : "لا توجد طلبات بعد."}</AdminEmpty>
      ) : (
        <div className="overflow-hidden rounded-[8px] border border-mist bg-paper-white">
          <ul>
            {orders.map((order) => (
              <li key={order.id} className="grid gap-3 border-b border-mist px-4 py-3 text-[14px] last:border-0 lg:grid-cols-[1.1fr_1fr_1fr_1fr_1.2fr_1.4fr] lg:items-center">
                <Link href={`/admin/orders/${order.id}`} className="font-mono text-carbon-ink">
                  {order.orderNumber}
                </Link>
                <span>{order.customerName}</span>
                <span className="text-graphite" dir="ltr">{order.customerPhone}</span>
                <span>{formatMoney(order.totalPiasters)}</span>
                <span className="text-graphite">{formatAdminTime(order.createdAt)}</span>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill>{statusLabels[order.status]}</StatusPill>
                  <OrderStatusForm orderId={order.id} status={order.status} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AdminPage>
  );
}
