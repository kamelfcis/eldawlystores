import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionRole } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { OrderStatus } from "@/lib/types/database";

export const metadata = { title: "تفاصيل الطلب" };

const statusLabels: Record<OrderStatus, string> = {
  pending: "معلق",
  confirmed: "مؤكد",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
  rejected: "مرفوض",
};

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const session = await getSessionRole();
  if (!session?.userId) redirect("/account/login");
  if (!isSupabaseConfigured()) notFound();

  const { id } = await params;
  const supabase = await createClient();

  const [orderResult, itemsResult, historyResult] = await Promise.all([
    supabase
      .from("orders")
      .select("id, order_number, status, total_piasters, created_at")
      .eq("id", id)
      .eq("user_id", session.userId)
      .maybeSingle(),
    supabase
      .from("order_items")
      .select("id, product_name, quantity, unit_price_piasters")
      .eq("order_id", id),
    supabase
      .from("order_status_history")
      .select("id, status, note, created_at")
      .eq("order_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (orderResult.error || !orderResult.data) notFound();

  const order = orderResult.data;
  const items = itemsResult.data ?? [];
  const history = historyResult.error ? [] : (historyResult.data ?? []);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">تفاصيل الطلب</h1>
        <Link href="/account/orders" className="text-[14px] text-graphite hover:text-carbon-ink hover:underline">
          العودة للطلبات
        </Link>
      </div>

      <div className="rounded-[8px] border border-mist p-4 text-sm">
        <p>
          رقم الطلب: <span className="font-mono font-bold">{order.order_number}</span>
        </p>
        <p className="mt-1 text-graphite">الحالة: {statusLabels[order.status as OrderStatus] ?? order.status}</p>
        <p className="mt-1 text-graphite">الإجمالي: {formatMoney(order.total_piasters)}</p>
      </div>

      <section>
        <h2 className="mb-3 text-[16px] font-bold">المنتجات</h2>
        <ul className="space-y-2 text-sm">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 border-b border-mist pb-2">
              <span>{item.product_name} × {item.quantity}</span>
              <span>{formatMoney(item.unit_price_piasters * item.quantity)}</span>
            </li>
          ))}
        </ul>
      </section>

      {history.length > 0 ? (
        <section>
          <h2 className="mb-3 text-[16px] font-bold">سجل الحالة</h2>
          <ol className="relative space-y-4 border-s border-mist ps-4">
            {history.map((entry) => (
              <li key={entry.id} className="relative">
                <span aria-hidden className="absolute -start-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-carbon-ink" />
                <p className="text-[14px] font-bold text-retail-ink">
                  {statusLabels[entry.status as OrderStatus] ?? entry.status}
                </p>
                <p className="text-[12px] text-graphite">
                  {new Date(entry.created_at).toLocaleString("ar-EG")}
                </p>
                {entry.note ? <p className="mt-1 text-[13px] text-graphite">{entry.note}</p> : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
