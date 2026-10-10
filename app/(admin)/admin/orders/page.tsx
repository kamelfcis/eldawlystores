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

const orderColumns = "lg:grid-cols-[1.1fr_1fr_1fr_1fr_1.2fr_1.4fr]";

function isStatus(value: string | undefined): value is OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus);
}

function filterChipClass(selected: boolean): string {
  const base =
    "inline-flex min-h-10 items-center rounded-full border px-3 text-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carbon-ink";
  return selected
    ? `${base} border-carbon-ink bg-carbon-ink text-paper-white`
    : `${base} border-ash-border bg-paper-white text-graphite`;
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
        <Link href="/admin/orders" className={filterChipClass(!status)}>
          الكل
        </Link>
        {ORDER_STATUSES.map((value) => (
          <Link key={value} href={`/admin/orders?status=${value}`} className={filterChipClass(status === value)}>
            {statusLabels[value]}
          </Link>
        ))}
      </div>
      {orders.length === 0 ? (
        <AdminEmpty>{status ? "لا توجد طلبات بهذه الحالة." : "لا توجد طلبات بعد."}</AdminEmpty>
      ) : (
        <div className="space-y-3 lg:space-y-0 lg:overflow-hidden lg:rounded-[8px] lg:border lg:border-mist lg:bg-paper-white">
          <div
            className={`hidden ${orderColumns} border-b border-mist bg-fog px-4 py-3 text-[14px] font-bold tracking-[0.038em] text-carbon-ink lg:grid lg:items-center`}
          >
            <span>رقم الطلب</span>
            <span>العميل</span>
            <span>الهاتف</span>
            <span>الإجمالي</span>
            <span>التاريخ</span>
            <span>الحالة</span>
          </div>
          <ul>
            {orders.map((order) => (
              <li
                key={order.id}
                className={`grid gap-3 rounded-[8px] border border-mist bg-paper-white px-4 py-3 text-[14px] lg:rounded-none lg:border-0 lg:border-b lg:last:border-0 ${orderColumns} lg:items-center`}
              >
                <div>
                  <p className="mb-1 text-[12px] text-graphite lg:hidden">رقم الطلب</p>
                  <Link href={`/admin/orders/${order.id}`} className="font-mono font-bold text-carbon-ink underline-offset-2 hover:underline">
                    {order.orderNumber}
                  </Link>
                </div>
                <div>
                  <p className="mb-1 text-[12px] text-graphite lg:hidden">العميل</p>
                  <span className="text-[14px] text-carbon-ink">{order.customerName}</span>
                </div>
                <div>
                  <p className="mb-1 text-[12px] text-graphite lg:hidden">الهاتف</p>
                  <span className="text-graphite" dir="ltr">
                    {order.customerPhone}
                  </span>
                </div>
                <div>
                  <p className="mb-1 text-[12px] text-graphite lg:hidden">الإجمالي</p>
                  <span className="text-[14px] text-carbon-ink">{formatMoney(order.totalPiasters)}</span>
                </div>
                <div>
                  <p className="mb-1 text-[12px] text-graphite lg:hidden">التاريخ</p>
                  <span className="text-graphite">{formatAdminTime(order.createdAt)}</span>
                </div>
                <div className="min-w-0 space-y-2">
                  <p className="text-[12px] text-graphite lg:hidden">الحالة</p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                    <StatusPill>{statusLabels[order.status]}</StatusPill>
                    <OrderStatusForm orderId={order.id} status={order.status} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AdminPage>
  );
}
