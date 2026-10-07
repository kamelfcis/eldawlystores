import { NextRequest, NextResponse } from "next/server";
import { buildXlsx } from "@/lib/admin/excel";
import { getAdminCatalog, parseAdminCatalogFilters } from "@/lib/admin/queries";
import { formatMoney } from "@/lib/money";
import { listAdminOrders } from "@/lib/orders";
import type { OrderStatus, ProductStatus } from "@/lib/types/database";

export const dynamic = "force-dynamic";

const productStatusLabels: Record<ProductStatus, string> = {
  draft: "مسودة",
  active: "نشط",
  archived: "مؤرشف",
};

const orderStatusLabels: Record<OrderStatus, string> = {
  pending: "معلق",
  confirmed: "مؤكد",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
  rejected: "مرفوض",
};

function xlsxResponse(bytes: Uint8Array, filename: string) {
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: NextRequest) {
  const resource = request.nextUrl.searchParams.get("resource");

  if (resource === "products") {
    const filters = parseAdminCatalogFilters({
      name: request.nextUrl.searchParams.get("name"),
      sku: request.nextUrl.searchParams.get("sku"),
      category: request.nextUrl.searchParams.get("category"),
      brand: request.nextUrl.searchParams.get("brand"),
      status: request.nextUrl.searchParams.get("status"),
      stock: request.nextUrl.searchParams.get("stock"),
    });
    const { products, error } = await getAdminCatalog(filters);
    if (error) return NextResponse.json({ error: "تعذر تصدير المنتجات" }, { status: 500 });

    const bytes = await buildXlsx(
      "المنتجات",
      ["المنتج", "SKU", "السعر", "المخزون", "الحالة"],
      products.map((product) => [
        product.name_ar,
        product.sku,
        formatMoney(product.price_piasters),
        product.stock,
        productStatusLabels[product.status],
      ])
    );
    return xlsxResponse(bytes, "products.xlsx");
  }

  if (resource === "orders") {
    const { orders, error } = await listAdminOrders();
    if (error) return NextResponse.json({ error: "تعذر تصدير الطلبات" }, { status: 500 });

    const bytes = await buildXlsx(
      "الطلبات",
      ["رقم الطلب", "العميل", "الحالة", "الإجمالي"],
      orders.map((order) => [
        order.orderNumber,
        order.customerName,
        orderStatusLabels[order.status],
        formatMoney(order.totalPiasters),
      ])
    );
    return xlsxResponse(bytes, "orders.xlsx");
  }

  return NextResponse.json({ error: "نوع التصدير غير صالح" }, { status: 400 });
}
