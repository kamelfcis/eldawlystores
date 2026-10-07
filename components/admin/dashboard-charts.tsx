"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Banknote, ChartBar, ChartColumn, type LucideIcon } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney } from "@/lib/money";
import { seriesHasOrders, seriesHasRevenue, type AdminDayPoint } from "@/lib/orders/trends";
import type { OrderStatus } from "@/lib/types/database";

export interface StatusChartPoint {
  status: OrderStatus;
  label: string;
  count: number;
  color: string;
}

const axisTick = { fill: "#606562", fontSize: 12 };
const tooltipShell = {
  boxShadow: "none",
  border: "none",
  background: "transparent",
  padding: 0,
};

function ChartTooltip({
  active,
  payload,
  label,
  formatValue,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ value?: number | string }>;
  label?: string | number;
  formatValue: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const raw = payload[0]?.value;
  const value = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(value)) return null;

  return (
    <div className="rounded-[4px] border border-mist bg-paper-white px-3 py-2 text-[14px] text-carbon-ink">
      <p>{label}</p>
      <p className="mt-1 font-bold">{formatValue(value)}</p>
    </div>
  );
}

function ChartCard({
  title,
  icon: Icon,
  iconClassName,
  children,
}: {
  title: string;
  icon: LucideIcon;
  iconClassName: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-[8px] border border-mist bg-paper-white p-4 shadow-[0_8px_24px_rgb(26_33_30/0.06)]">
      <h2 className="mb-3 flex items-center gap-2 text-[14px] font-bold tracking-[0.038em] text-carbon-ink">
        <Icon className={`size-4 shrink-0 ${iconClassName}`} aria-hidden="true" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function EmptyCopy({ children, tall = false }: { children: ReactNode; tall?: boolean }) {
  return (
    <p className={`flex items-center justify-center px-4 text-center text-[14px] text-graphite ${tall ? "h-64" : "h-56"}`}>
      {children}
    </p>
  );
}

function countLabel(value: number): string {
  return value.toLocaleString("ar-EG");
}

export function DashboardCharts({
  days,
  statuses,
}: {
  days: AdminDayPoint[];
  statuses: StatusChartPoint[];
}) {
  const ordersEmpty = !seriesHasOrders(days);
  const revenueEmpty = !seriesHasRevenue(days);
  const statusEmpty = statuses.every((status) => status.count === 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="الطلبات يوميًا" icon={ChartColumn} iconClassName="text-category-blue">
          {ordersEmpty ? (
            <EmptyCopy>لا توجد طلبات خلال آخر 14 يومًا.</EmptyCopy>
          ) : (
            <div dir="ltr" className="h-56 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 480, height: 224 }}>
                <BarChart data={days} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#e0e0e0" vertical={false} />
                  <XAxis dataKey="label" tick={axisTick} interval={1} />
                  <YAxis allowDecimals={false} tick={axisTick} width={32} />
                  <Tooltip
                    cursor={{ fill: "#eef1f0" }}
                    wrapperStyle={tooltipShell}
                    content={<ChartTooltip formatValue={countLabel} />}
                  />
                  <Bar dataKey="orders" fill="#1d4e89" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="الإيرادات يوميًا" icon={Banknote} iconClassName="text-category-teal">
          {revenueEmpty ? (
            <EmptyCopy>لا توجد إيرادات خلال آخر 14 يومًا.</EmptyCopy>
          ) : (
            <div dir="ltr" className="h-56 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 480, height: 224 }}>
                <BarChart data={days} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                  <CartesianGrid stroke="#e0e0e0" vertical={false} />
                  <XAxis dataKey="label" tick={axisTick} interval={1} />
                  <YAxis
                    tick={axisTick}
                    width={112}
                    tickFormatter={(value) => formatMoney(typeof value === "number" ? value : Number(value))}
                  />
                  <Tooltip
                    cursor={{ fill: "#eef1f0" }}
                    wrapperStyle={tooltipShell}
                    content={<ChartTooltip formatValue={formatMoney} />}
                  />
                  <Bar dataKey="revenuePiasters" fill="#0f6e6b" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      <ChartCard title="الطلبات حسب الحالة" icon={ChartBar} iconClassName="text-carbon-ink">
        {statusEmpty ? (
          <EmptyCopy tall>لا توجد طلبات لعرضها حسب الحالة.</EmptyCopy>
        ) : (
          <div dir="ltr" className="h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 480, height: 256 }}>
              <BarChart data={statuses} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid stroke="#e0e0e0" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={axisTick} />
                <YAxis type="category" dataKey="label" tick={axisTick} width={88} />
                <Tooltip
                  cursor={{ fill: "#eef1f0" }}
                  wrapperStyle={tooltipShell}
                  content={<ChartTooltip formatValue={countLabel} />}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={18}>
                  {statuses.map((status) => (
                    <Cell key={status.status} fill={status.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <ul className="mt-3 flex flex-wrap gap-2">
          {statuses.map((status) => (
            <li key={status.status}>
              <Link
                href={`/admin/orders?status=${status.status}`}
                className="inline-flex items-center gap-2 rounded-[4px] border border-mist bg-fog px-3 py-2 text-[14px] text-graphite hover:text-carbon-ink"
              >
                <span className="size-2 rounded-full" style={{ backgroundColor: status.color }} />
                {status.label} <span className="text-carbon-ink">{countLabel(status.count)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </ChartCard>
    </div>
  );
}
