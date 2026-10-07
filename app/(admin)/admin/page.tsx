import Link from "next/link";
import { Banknote, Receipt, ShoppingBag, TriangleAlert, type LucideIcon } from "lucide-react";
import { DashboardCharts } from "@/components/admin/dashboard-charts";
import { AdminEmpty, AdminError, AdminPage, StatusPill, formatAdminTime } from "@/components/admin/admin-ui";
import { formatMoney } from "@/lib/money";
import { ORDER_STATUSES, getAdminDailyTrend, getAdminMetrics, listAdminOrders } from "@/lib/orders";
import type { OrderStatus } from "@/lib/types/database";

export const metadata = { title: "لوحة التحكم" };

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

export default async function AdminDashboardPage() {
  const [metrics, trend, latest] = await Promise.all([
    getAdminMetrics(),
    getAdminDailyTrend(),
    listAdminOrders({ limit: 8 }),
  ]);
  const error = [metrics.error, trend.error, latest.error].filter(Boolean).join(" ");

  return (
    <AdminPage title="لوحة التحكم">
      <AdminError message={error || null} />
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric label="طلبات اليوم" value={String(metrics.ordersToday)} icon={ShoppingBag} accent="blue" />
        <Metric label="الإيرادات" value={formatMoney(metrics.revenuePiasters)} hint="بدون الملغي والمرفوض" icon={Banknote} accent="teal" />
        <Metric label="متوسط الطلب" value={formatMoney(metrics.averageOrderPiasters)} icon={Receipt} accent="violet" />
        <Metric label="مخزون منخفض" value={String(metrics.lowStockCount)} icon={TriangleAlert} accent="ember" />
      </section>

      <DashboardCharts
        days={trend.days}
        statuses={ORDER_STATUSES.map((status) => ({
          status,
          label: statusLabels[status],
          count: metrics.byStatus[status],
          color: statusColors[status],
        }))}
      />

      <section className="overflow-hidden rounded-[8px] border border-mist bg-paper-white">
        <h2 className="border-b border-mist px-4 py-3 text-[14px] font-bold tracking-[0.038em]">آخر الطلبات</h2>
        {latest.orders.length === 0 ? (
          <AdminEmpty>لا توجد طلبات بعد.</AdminEmpty>
        ) : (
          <ul>
            {latest.orders.map((order) => (
              <li key={order.id} className="grid grid-cols-2 gap-2 border-b border-mist px-4 py-3 text-[14px] last:border-0 sm:grid-cols-5">
                <Link href={`/admin/orders/${order.id}`} className="font-mono text-carbon-ink">
                  {order.orderNumber}
                </Link>
                <span>{order.customerName}</span>
                <StatusPill>{statusLabels[order.status]}</StatusPill>
                <span>{formatMoney(order.totalPiasters)}</span>
                <span className="text-graphite">{formatAdminTime(order.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="overflow-hidden rounded-[8px] border border-mist bg-paper-white">
        <h2 className="border-b border-mist px-4 py-3 text-[14px] font-bold tracking-[0.038em]">مخزون منخفض</h2>
        {metrics.lowStock.length === 0 ? (
          <AdminEmpty>لا توجد منتجات منخفضة المخزون.</AdminEmpty>
        ) : (
          <ul>
            {metrics.lowStock.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 border-b border-mist px-4 py-3 text-[14px] last:border-0">
                <Link href={item.productId ? `/admin/products?edit=${item.productId}` : "/admin/products"} className="text-carbon-ink">
                  {item.product}
                </Link>
                <span className="font-mono text-graphite">{item.sku}</span>
                <span className="text-ember-red">{item.stock}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminPage>
  );
}

const metricAccents = {
  blue: { edge: "border-t-category-blue", icon: "text-category-blue" },
  teal: { edge: "border-t-category-teal", icon: "text-category-teal" },
  violet: { edge: "border-t-category-violet", icon: "text-category-violet" },
  ember: { edge: "border-t-ember-red", icon: "text-ember-red" },
} as const;

function Metric({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  accent: keyof typeof metricAccents;
}) {
  const tone = metricAccents[accent];
  return (
    <div
      className={`rounded-[8px] border border-mist border-t-2 bg-paper-white p-4 shadow-[0_8px_24px_rgba(26,33,30,0.06)] ${tone.edge}`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`size-4 shrink-0 ${tone.icon}`} aria-hidden="true" />
        <p className="text-[14px] text-graphite">{label}</p>
      </div>
      <p className="mt-2 text-[16px] font-bold tracking-[0.057em] text-carbon-ink">{value}</p>
      {hint ? <p className="mt-1 text-[12px] text-graphite">{hint}</p> : null}
    </div>
  );
}
