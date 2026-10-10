import { NextRequest, NextResponse } from "next/server";
import { checkoutSchema } from "@/lib/checkout/schema";
import { processCheckout } from "@/lib/checkout";
import { getCheckoutSessionUserId } from "@/lib/checkout/session-user";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "طلبات كثيرة — حاول لاحقاً" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "بيانات غير صالحة" },
        { status: 400 }
      );
    }

    const userId = await getCheckoutSessionUserId();
    const result = await processCheckout(parsed.data, userId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      orderId: result.orderId,
      orderNumber: result.orderNumber,
      accessToken: result.accessToken,
    });
  } catch {
    return NextResponse.json({ error: "حدث خطأ في الخادم" }, { status: 500 });
  }
}
