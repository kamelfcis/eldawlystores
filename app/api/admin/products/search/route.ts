import { NextRequest, NextResponse } from "next/server";
import { searchAdminProducts } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const { products, error } = await searchAdminProducts(q);
  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ products });
}
