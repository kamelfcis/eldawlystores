import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminEmpty, AdminError, AdminPage, StatusPill, formatAdminTime } from "@/components/admin/admin-ui";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { formatMoney } from "@/lib/money";
import { getAdminOrder } from "@/lib/orders";
import type { OrderStatus } from "@/lib/types/database";

const statusLabels: Record<OrderStatus, string> = {
  pending: "معلق",
  confirmed: "مؤكد",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
  rejected: "مرفوض",
};

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { order, error } = await getAdminOrder(id);
  if (!order && !error) notFound();

  return (
    <AdminPage
      title={order ? order.orderNumber : "الطلب"}
      action={
        <Link href="/admin/orders" className="text-[14px] font-bold tracking-[0.038em] text-carbon-ink">
          كل الطلبات
        </Link>
      }
    >
      <AdminError message={error} />
      {!order ? (
        <AdminEmpty>تعذر عرض الطلب.</AdminEmpty>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <section className="rounded-[8px] border border-mist bg-paper-white p-4">
            <h2 className="text-[14px] font-bold tracking-[0.038em]">الأصناف</h2>
            {order.items.length === 0 ? (
              <p className="mt-3 text-[14px] text-graphite">لا توجد أصناف.</p>
            ) : (
              <ul className="mt-3 divide-y divide-mist">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 py-3 text-[14px]">
                    <span>
                      {item.productName}
                      <span className="mt-1 block font-mono text-graphite">{item.sku}</span>
                    </span>
                    <span className="text-graphite">{item.quantity} × {formatMoney(item.unitPricePiasters)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <div className="space-y-4">
            <section className="rounded-[8px] border border-mist bg-paper-white p-4 text-[14px]">
              <p>{order.customerName}</p>
              <p className="text-graphite" dir="ltr">{order.customerPhone}</p>
              <p className="text-graphite">{order.customerEmail}</p>
              <p className="mt-3">{formatMoney(order.totalPiasters)}</p>
              <p className="text-graphite">شحن {formatMoney(order.shippingPiasters)}</p>
              <p className="mt-2 text-graphite">{formatAdminTime(order.createdAt)}</p>
              <div className="mt-3">
                <StatusPill>{statusLabels[order.status]}</StatusPill>
              </div>
              <div className="mt-4">
                <OrderStatusForm orderId={order.id} status={order.status} />
              </div>
            </section>
            <section className="rounded-[8px] border border-mist bg-paper-white p-4">
              <h2 className="text-[14px] font-bold tracking-[0.038em]">عنوان الشحن</h2>
              {order.addressLines.length === 0 ? (
                <p className="mt-2 text-[14px] text-graphite">لا يوجد عنوان.</p>
              ) : (
                <ul className="mt-2 space-y-1 text-[14px]">
                  {order.addressLines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
            </section>
            <section className="rounded-[8px] border border-mist bg-paper-white p-4">
              <h2 className="text-[14px] font-bold tracking-[0.038em]">سجل الحالة</h2>
              {order.history.length === 0 ? (
                <p className="mt-2 text-[14px] text-graphite">لا يوجد سجل بعد.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {order.history.map((entry) => (
                    <li key={entry.id} className="border-b border-mist pb-3 text-[14px] last:border-0">
                      <StatusPill>{statusLabels[entry.status]}</StatusPill>
                      <p className="mt-1 text-graphite">{formatAdminTime(entry.createdAt)}</p>
                      {entry.note ? <p className="mt-1">{entry.note}</p> : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}
    </AdminPage>
  );
}
