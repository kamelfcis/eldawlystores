import { describe, expect, it } from "vitest";
import {
  bucketOrdersByDay,
  lastCairoDays,
  seriesHasOrders,
  seriesHasRevenue,
  TREND_DAY_COUNT,
} from "@/lib/orders/trends";

const now = new Date("2026-10-06T12:00:00Z");

describe("admin daily trends", () => {
  it("includes every day in the last 14, including zeros", () => {
    const days = bucketOrdersByDay([], now);
    expect(days).toHaveLength(TREND_DAY_COUNT);
    expect(days.map((day) => day.date)).toEqual(lastCairoDays(TREND_DAY_COUNT, now));
    expect(days.every((day) => day.orders === 0 && day.revenuePiasters === 0)).toBe(true);
    expect(seriesHasOrders(days)).toBe(false);
    expect(seriesHasRevenue(days)).toBe(false);
  });

  it("counts orders and keeps cancelled and rejected out of revenue", () => {
    const days = bucketOrdersByDay(
      [
        { createdAt: "2026-10-06T08:00:00Z", status: "confirmed", totalPiasters: 150000 },
        { createdAt: "2026-10-06T09:00:00Z", status: "cancelled", totalPiasters: 90000 },
        { createdAt: "2026-10-05T09:00:00Z", status: "rejected", totalPiasters: 40000 },
        { createdAt: "2026-09-01T09:00:00Z", status: "delivered", totalPiasters: 10000 },
      ],
      now
    );

    const today = days.find((day) => day.date === "2026-10-06");
    const yesterday = days.find((day) => day.date === "2026-10-05");
    expect(today).toMatchObject({ orders: 2, revenuePiasters: 150000 });
    expect(yesterday).toMatchObject({ orders: 1, revenuePiasters: 0 });
    expect(days.reduce((sum, day) => sum + day.revenuePiasters, 0)).toBe(150000);
    expect(seriesHasOrders(days)).toBe(true);
    expect(seriesHasRevenue(days)).toBe(true);
  });
});
