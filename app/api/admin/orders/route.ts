import { NextResponse } from "next/server";
import { listAdminOrders } from "@/lib/orders";

export async function GET() {
  const { orders, error } = await listAdminOrders();
  if (error) return NextResponse.json({ error: "تعذر قراءة الطلبات" }, { status: 500 });
  return NextResponse.json({ orders });
}
