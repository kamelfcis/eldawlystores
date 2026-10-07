import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { getOrderByAccessToken } from "@/lib/orders";
import type { OrderStatus } from "@/lib/types/database";

export const dynamic = "force-dynamic";

interface OrderPageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ confirmed?: string }>;
}

const statusLabels: Record<OrderStatus, string> = {
  pending: "معلق",
  confirmed: "مؤكد",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
  rejected: "مرفوض",
};

export default async function OrderConfirmationPage({ params, searchParams }: OrderPageProps) {
  const { token } = await params;
  const sp = await searchParams;
  const isConfirmed = sp.confirmed === "1";
  const lookup = await getOrderByAccessToken(token);

  return (
    <div className="max-w-lg mx-auto space-y-6 py-12">
      {lookup.status === "found" ? (
        <div className="space-y-4 text-center">
          {isConfirmed ? <div className="text-4xl">✓</div> : null}
          <h1 className="text-2xl font-bold">{isConfirmed ? "تم تأكيد طلبك!" : "تفاصيل الطلب"}</h1>
          <p className="text-graphite">رقم الطلب: <span className="font-mono">{lookup.order.order_number}</span></p>
          <p className="text-sm text-graphite">الحالة: {statusLabels[lookup.order.status]}</p>
          <ul className="space-y-2 text-sm text-right">
            {lookup.order.order_items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4 border-b border-mist pb-2">
                <span>{item.product_name} × {item.quantity}</span>
                <span>{formatMoney(item.unit_price_piasters * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <p className="font-bold">الإجمالي: {formatMoney(lookup.order.total_piasters)}</p>
        </div>
      ) : (
        <div className="space-y-4 text-center">
          {isConfirmed ? (
            <>
              <div className="text-4xl">✓</div>
              <h1 className="text-2xl font-bold">تم تأكيد طلبك!</h1>
              <p className="text-graphite">شكراً لتسوقك من Doly Stores. سنتواصل معك قريباً لتأكيد الطلب.</p>
            </>
          ) : (
            <h1 className="text-2xl font-bold">تفاصيل الطلب</h1>
          )}
          <p className="text-sm text-graphite">
            {lookup.status === "not-configured" ? "تفاصيل الطلب غير متاحة حالياً." : "لم يتم العثور على الطلب."}
          </p>
        </div>
      )}
      <div className="text-center">
        <Button asChild>
          <Link href="/">العودة للمتجر</Link>
        </Button>
      </div>
    </div>
  );
}
