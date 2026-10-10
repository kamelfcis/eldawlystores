import Link from "next/link";
import {
  AdminEmpty,
  AdminError,
  AdminList,
  AdminListCell,
  AdminListRow,
  AdminPage,
  StatusPill,
  adminFilterChipClass,
  formatAdminTime,
} from "@/components/admin/admin-ui";
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

const statusColors: Record<OrderStatus, string> = {
  pending: "#c47b12",
  confirmed: "#1d4e89",
  shipped: "#0f6e6b",
  delivered: "#5c4d8a",
  cancelled: "#cc2e39",
  rejected: "#cc2e39",
};

const orderColumns = "lg:grid-cols-[1.1fr_1fr_1fr_1fr_1.2fr_1.4fr]";

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
        <Button asChild variant="outline">
          <a href="/api/admin/export?resource=orders">تصدير Excel</a>
        </Button>
      }
    >
      <AdminError message={error} />
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/orders" className={adminFilterChipClass(!status)}>
          الكل
        </Link>
        {ORDER_STATUSES.map((value) => (
          <Link key={value} href={`/admin/orders?status=${value}`} className={adminFilterChipClass(status === value)}>
            {statusLabels[value]}
          </Link>
        ))}
      </div>
      {orders.length === 0 ? (
        <AdminEmpty>{status ? "لا توجد طلبات بهذه الحالة." : "لا توجد طلبات بعد."}</AdminEmpty>
      ) : (
        <AdminList columns={["رقم الطلب", "العميل", "الهاتف", "الإجمالي", "التاريخ", "الحالة"]} gridClass={orderColumns}>
          {orders.map((order) => (
            <AdminListRow key={order.id} gridClass={orderColumns}>
              <AdminListCell label="رقم الطلب">
                <Link href={`/admin/orders/${order.id}`} className="font-mono font-bold text-carbon-ink underline-offset-2 hover:underline">
                  {order.orderNumber}
                </Link>
              </AdminListCell>
              <AdminListCell label="العميل">
                <span className="text-[14px] text-carbon-ink">{order.customerName}</span>
              </AdminListCell>
              <AdminListCell label="الهاتف">
                <span className="text-graphite" dir="ltr">
                  {order.customerPhone}
                </span>
              </AdminListCell>
              <AdminListCell label="الإجمالي">
                <span className="text-[14px] text-carbon-ink">{formatMoney(order.totalPiasters)}</span>
              </AdminListCell>
              <AdminListCell label="التاريخ">
                <span className="text-graphite">{formatAdminTime(order.createdAt)}</span>
              </AdminListCell>
              <AdminListCell label="الحالة">
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  <StatusPill color={statusColors[order.status]}>{statusLabels[order.status]}</StatusPill>
                  <OrderStatusForm orderId={order.id} status={order.status} />
                </div>
              </AdminListCell>
            </AdminListRow>
          ))}
        </AdminList>
      )}
    </AdminPage>
  );
}
