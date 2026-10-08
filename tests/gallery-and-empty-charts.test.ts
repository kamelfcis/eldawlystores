import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DashboardCharts } from "@/components/admin/dashboard-charts";
import { ProductGallery } from "@/components/product/product-gallery";
import { emptyDaySeries } from "@/lib/orders/trends";

describe("product gallery states", () => {
  it("uses the placeholder and no thumbnails when there are no images", () => {
    const html = renderToStaticMarkup(createElement(ProductGallery, { productName: "منتج", images: [] }));
    expect(html).toContain("/placeholder-product.svg");
    expect(html).toContain("منتج");
    expect(html).not.toContain("data-gallery-thumb");
  });

  it("shows one image and no thumbnail row", () => {
    const html = renderToStaticMarkup(
      createElement(ProductGallery, {
        productName: "منتج",
        images: [{ id: "only", url: "/packshot.jpg", alt_text: "وجه" }],
      })
    );
    expect(html).toContain("packshot.jpg");
    expect(html).toContain("وجه");
    expect(html).not.toContain("data-gallery-thumb");
  });
});

describe("admin charts empty state", () => {
  it("renders the Arabic lines in the chart frames and no bars", () => {
    const html = renderToStaticMarkup(
      createElement(DashboardCharts, {
        days: emptyDaySeries(new Date("2026-10-06T12:00:00Z")),
        statuses: [
          { status: "pending", label: "معلق", count: 0, color: "#c47b12" },
          { status: "confirmed", label: "مؤكد", count: 0, color: "#1d4e89" },
          { status: "shipped", label: "تم الشحن", count: 0, color: "#0f6e6b" },
          { status: "delivered", label: "تم التسليم", count: 0, color: "#5c4d8a" },
          { status: "cancelled", label: "ملغي", count: 0, color: "#cc2e39" },
          { status: "rejected", label: "مرفوض", count: 0, color: "#cc2e39" },
        ],
      })
    );
    expect(html).toContain("لا توجد طلبات خلال آخر 14 يومًا.");
    expect(html).toContain("لا توجد إيرادات خلال آخر 14 يومًا.");
    expect(html).toContain("لا توجد طلبات لعرضها حسب الحالة.");
    expect(html).toContain("h-56");
    expect(html).toContain("h-64");
    expect(html).toContain("/admin/orders?status=pending");
    expect(html).not.toContain("recharts");
  });
});
