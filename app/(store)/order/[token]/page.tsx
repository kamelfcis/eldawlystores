import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { getOrderByAccessToken } from "@/lib/orders";
import { getStoreWhatsapp } from "@/lib/store-settings";
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
  const [lookup, whatsapp] = await Promise.all([getOrderByAccessToken(token), getStoreWhatsapp()]);
  const whatsappHref = whatsapp ? `https://wa.me/20${whatsapp.slice(1)}` : null;

  return (
    <div className="mx-auto max-w-lg space-y-6 py-12">
      {lookup.status === "found" ? (
        <div className="space-y-5 text-center">
          {isConfirmed ? (
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-fog text-2xl text-retail-red" aria-hidden>
              ✓
            </div>
          ) : null}
          <div>
            <h1 className="text-2xl font-bold text-retail-ink">
              {isConfirmed ? "تم تأكيد طلبك!" : "تفاصيل الطلب"}
            </h1>
            {isConfirmed ? (
              <p className="mt-2 text-[14px] text-graphite">شكراً لتسوقك من Doly Stores. سنتواصل معك قريباً لتأكيد الطلب.</p>
            ) : null}
          </div>
          <div className="rounded-[8px] border border-mist bg-paper-white p-4 text-start text-sm">
            <p className="text-graphite">
              رقم الطلب: <span className="font-mono font-bold text-carbon-ink">{lookup.order.order_number}</span>
            </p>
            <p className="mt-1 text-graphite">الحالة: {statusLabels[lookup.order.status]}</p>
          </div>
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
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-fog text-2xl text-retail-red" aria-hidden>
                ✓
              </div>
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
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link href="/">العودة للمتجر</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/products">تسوق المزيد</Link>
        </Button>
        {whatsappHref ? (
          <Button asChild variant="outline">
            <Link href={whatsappHref} target="_blank" rel="noopener noreferrer">
              تواصل عبر واتساب
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
