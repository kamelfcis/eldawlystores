import { NextRequest, NextResponse } from "next/server";
import { updateAdminOrderStatus } from "@/lib/orders";
import type { OrderStatus } from "@/lib/types/database";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled", "rejected"]),
  note: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const result = await updateAdminOrderStatus(id, parsed.data.status as OrderStatus, parsed.data.note);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
