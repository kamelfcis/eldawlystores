import type { OrderStatus } from "@/lib/types/database";

export const TREND_DAY_COUNT = 14;

const REVENUE_STATUSES = new Set<OrderStatus>(["pending", "confirmed", "shipped", "delivered"]);

export interface AdminDayPoint {
  date: string;
  label: string;
  orders: number;
  revenuePiasters: number;
}

export interface TrendOrderRow {
  createdAt: string;
  status: string;
  totalPiasters: number;
}

export function cairoCivilDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function lastCairoDays(count: number, now = new Date()): string[] {
  const today = cairoCivilDate(now);
  const [year, month, day] = today.split("-").map(Number);
  const anchor = new Date(Date.UTC(year, month - 1, day));
  const keys: string[] = [];

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const cursor = new Date(anchor);
    cursor.setUTCDate(anchor.getUTCDate() - offset);
    const y = cursor.getUTCFullYear();
    const m = String(cursor.getUTCMonth() + 1).padStart(2, "0");
    const d = String(cursor.getUTCDate()).padStart(2, "0");
    keys.push(`${y}-${m}-${d}`);
  }

  return keys;
}

export function nextCivilDate(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const cursor = new Date(Date.UTC(year, month - 1, day));
  cursor.setUTCDate(cursor.getUTCDate() + 1);
  const y = cursor.getUTCFullYear();
  const m = String(cursor.getUTCMonth() + 1).padStart(2, "0");
  const d = String(cursor.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function cairoDayLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const noon = new Date(Date.UTC(year, month - 1, day, 12));
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(noon);
}

export function cairoMidnightIso(dateKey: string): string {
  const probe = new Date(`${dateKey}T12:00:00Z`);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo",
    timeZoneName: "shortOffset",
    hour: "2-digit",
  }).formatToParts(probe);
  const name = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT+2";
  const match = name.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  const minutes = match
    ? (match[1] === "-" ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3] ?? 0))
    : 120;
  const sign = minutes >= 0 ? "+" : "-";
  const abs = Math.abs(minutes);
  const hours = String(Math.floor(abs / 60)).padStart(2, "0");
  const mins = String(abs % 60).padStart(2, "0");
  return `${dateKey}T00:00:00${sign}${hours}:${mins}`;
}

export function emptyDaySeries(now = new Date()): AdminDayPoint[] {
  return lastCairoDays(TREND_DAY_COUNT, now).map((date) => ({
    date,
    label: cairoDayLabel(date),
    orders: 0,
    revenuePiasters: 0,
  }));
}

export function bucketOrdersByDay(rows: TrendOrderRow[], now = new Date()): AdminDayPoint[] {
  const series = emptyDaySeries(now);
  const byDate = new Map(series.map((point) => [point.date, point]));

  for (const row of rows) {
    const created = new Date(row.createdAt);
    if (Number.isNaN(created.getTime())) continue;
    const point = byDate.get(cairoCivilDate(created));
    if (!point) continue;
    if (!Number.isInteger(row.totalPiasters)) continue;
    point.orders += 1;
    if (REVENUE_STATUSES.has(row.status as OrderStatus)) {
      point.revenuePiasters += row.totalPiasters;
    }
  }

  return series;
}

export function seriesHasOrders(days: AdminDayPoint[]): boolean {
  return days.some((day) => day.orders > 0);
}

export function seriesHasRevenue(days: AdminDayPoint[]): boolean {
  return days.some((day) => day.revenuePiasters > 0);
}
