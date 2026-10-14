import Link from "next/link";
import { MessageCircle } from "lucide-react";
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
import { customerTelHref, customerWhatsAppHref } from "@/lib/orders/customer-contact";
import { ORDER_STATUSES, allowedOrderStatuses, listAdminOrders } from "@/lib/orders";
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

const terminalStatuses = new Set<OrderStatus>(["delivered", "cancelled", "rejected"]);

const orderColumns = "lg:grid-cols-[1.1fr_1fr_1fr_1fr_1.2fr_1.4fr]";

function isStatus(value: string | undefined): value is OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus);
}

function orderRowEdgeColor(status: OrderStatus): string {
  return terminalStatuses.has(status) ? "#e0e0e0" : statusColors[status];
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
      meta={
        <p className="text-[14px] text-graphite">
          {orders.length.toLocaleString("ar-EG")} طلب
          {status ? ` · ${statusLabels[status]}` : ""}
        </p>
      }
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
          {orders.map((order) => {
            const telHref = customerTelHref(order.customerPhone);
            const whatsappHref = customerWhatsAppHref(order.customerPhone);
            const terminal = terminalStatuses.has(order.status);

            return (
              <AdminListRow
                key={order.id}
                gridClass={orderColumns}
                className="border-s-[2px]"
                style={{ borderColor: orderRowEdgeColor(order.status) }}
              >
                <AdminListCell label="رقم الطلب">
                  <Link href={`/admin/orders/${order.id}`} className="font-mono font-bold text-carbon-ink underline-offset-2 hover:underline">
                    {order.orderNumber}
                  </Link>
                </AdminListCell>
                <AdminListCell label="العميل">
                  <span className="text-[14px] text-carbon-ink">{order.customerName}</span>
                </AdminListCell>
                <AdminListCell label="الهاتف">
                  <div className="flex flex-wrap items-center gap-2">
                    {telHref ? (
                      <a href={telHref} dir="ltr" className="inline-flex min-h-10 items-center text-graphite underline-offset-2 hover:underline">
                        {order.customerPhone}
                      </a>
                    ) : (
                      <span className="text-graphite" dir="ltr">
                        {order.customerPhone}
                      </span>
                    )}
                    {whatsappHref ? (
                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="واتساب"
                        className="inline-flex min-h-10 items-center text-carbon-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-carbon-ink"
                      >
                        <MessageCircle size={14} aria-hidden="true" />
                      </a>
                    ) : null}
                  </div>
                </AdminListCell>
                <AdminListCell label="الإجمالي">
                  <span className="text-[14px] text-carbon-ink">{formatMoney(order.totalPiasters)}</span>
                </AdminListCell>
                <AdminListCell label="التاريخ">
                  <span className="text-graphite">{formatAdminTime(order.createdAt)}</span>
                </AdminListCell>
                <AdminListCell label="الحالة">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill color={statusColors[order.status]}>{statusLabels[order.status]}</StatusPill>
                    {!terminal ? (
                      <OrderStatusForm
                        orderId={order.id}
                        status={order.status}
                        allowedStatuses={allowedOrderStatuses(order.status)}
                      />
                    ) : null}
                  </div>
                </AdminListCell>
              </AdminListRow>
            );
          })}
        </AdminList>
      )}
    </AdminPage>
  );
}
