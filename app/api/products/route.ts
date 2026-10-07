import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/catalog";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const result = await getProducts({
    categorySlug: searchParams.get("category") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    sort: (searchParams.get("sort") as "price_asc" | "price_desc" | "rating") ?? undefined,
    page: Number(searchParams.get("page")) || 1,
  });
  return NextResponse.json(result);
}
