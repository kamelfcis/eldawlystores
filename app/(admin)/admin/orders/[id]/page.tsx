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
        <Link
          href="/admin/orders"
          className="inline-flex h-10 items-center text-[14px] font-bold tracking-[0.038em] text-carbon-ink"
        >
          العودة إلى الطلبات
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
              <div className="mt-3 overflow-hidden">
                <div className="hidden grid-cols-[2fr_1fr_0.8fr_1fr] gap-3 border-b border-mist pb-2 text-[14px] font-bold tracking-[0.038em] text-carbon-ink sm:grid">
                  <span>المنتج</span>
                  <span>SKU</span>
                  <span>الكمية</span>
                  <span>الإجمالي</span>
                </div>
                <ul className="divide-y divide-mist">
                  {order.items.map((item) => {
                    const sku = item.sku.trim() || "—";
                    const lineTotal = item.quantity * item.unitPricePiasters;
                    return (
                      <li key={item.id} className="grid gap-2 py-3 text-[14px] sm:grid-cols-[2fr_1fr_0.8fr_1fr] sm:items-center">
                        <div className="min-w-0">
                          <p className="text-[12px] text-graphite sm:hidden">المنتج</p>
                          <p className="break-words text-carbon-ink">{item.productName}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] text-graphite sm:hidden">SKU</p>
                          <p className="break-all font-mono text-graphite" dir="ltr">
                            {sku}
                          </p>
                        </div>
                        <div>
                          <p className="text-[12px] text-graphite sm:hidden">الكمية</p>
                          <p className="text-carbon-ink">{item.quantity}</p>
                        </div>
                        <div>
                          <p className="text-[12px] text-graphite sm:hidden">الإجمالي</p>
                          <p className="text-[14px] text-carbon-ink">{formatMoney(lineTotal)}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </section>
          <section className="rounded-[8px] border border-mist bg-paper-white p-4 text-[14px]">
            <h2 className="text-[14px] font-bold tracking-[0.038em]">بيانات الطلب</h2>
            <dl className="mt-3 space-y-3">
              <div>
                <dt className="text-graphite">العميل</dt>
                <dd className="text-carbon-ink">{order.customerName}</dd>
              </div>
              <div>
                <dt className="text-graphite">الهاتف</dt>
                <dd className="text-carbon-ink" dir="ltr">
                  {order.customerPhone}
                </dd>
              </div>
              <div>
                <dt className="text-graphite">البريد</dt>
                <dd className="break-all text-carbon-ink" dir="ltr">
                  {order.customerEmail}
                </dd>
              </div>
              <div>
                <dt className="text-graphite">العنوان</dt>
                <dd>
                  {order.addressLines.length === 0 ? (
                    <span className="text-graphite">لا يوجد عنوان.</span>
                  ) : (
                    <ul className="space-y-1">
                      {order.addressLines.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-graphite">المجموع الفرعي</dt>
                <dd className="text-carbon-ink">{formatMoney(order.subtotalPiasters)}</dd>
              </div>
              <div>
                <dt className="text-graphite">الشحن</dt>
                <dd className="text-carbon-ink">{formatMoney(order.shippingPiasters)}</dd>
              </div>
              <div>
                <dt className="text-graphite">الخصم</dt>
                <dd className="text-carbon-ink">{formatMoney(order.discountPiasters)}</dd>
              </div>
              <div>
                <dt className="text-graphite">الإجمالي</dt>
                <dd className="text-[14px] text-carbon-ink">{formatMoney(order.totalPiasters)}</dd>
              </div>
              <div>
                <dt className="text-graphite">التاريخ</dt>
                <dd className="text-graphite">{formatAdminTime(order.createdAt)}</dd>
              </div>
              <div>
                <dt className="mb-2 text-graphite">الحالة</dt>
                <dd>
                  <StatusPill>{statusLabels[order.status]}</StatusPill>
                </dd>
              </div>
            </dl>
            <div className="mt-4">
              <OrderStatusForm orderId={order.id} status={order.status} />
            </div>
            <div className="mt-6 border-t border-mist pt-4">
              <h3 className="text-[14px] font-bold tracking-[0.038em]">سجل الحالة</h3>
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
            </div>
          </section>
        </div>
      )}
    </AdminPage>
  );
}
