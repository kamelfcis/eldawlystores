import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { ReorderButton } from "@/components/account/reorder-button";
import { OrderStatusChip } from "@/components/account/order-status-chip";
import { getSessionRole } from "@/lib/auth";
import { ORDER_STATUS_LABELS } from "@/lib/account/order-status";
import { formatMoney } from "@/lib/money";
import { loadOrderItemImageUrls, PLACEHOLDER_PRODUCT_IMAGE } from "@/lib/orders/variant-images";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { OrderStatus } from "@/lib/types/database";

export const metadata = { title: "تفاصيل الطلب" };

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

function formatOrderDate(value: string): string {
  return new Date(value).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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
      .select("id, variant_id, product_name, quantity, unit_price_piasters")
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
  const status = order.status as OrderStatus;
  const imageByVariant = await loadOrderItemImageUrls(
    supabase,
    items.map((item) => item.variant_id)
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-retail-ink">تفاصيل الطلب</h1>
        <Link
          href="/account/orders"
          className="rounded-[4px] text-[14px] text-graphite hover:text-carbon-ink hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-carbon-ink"
        >
          العودة للطلبات
        </Link>
      </div>

      <div className="rounded-[8px] border border-retail-line bg-paper-white p-4 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <p>
            رقم الطلب:{" "}
            <span dir="ltr" className="font-mono font-bold text-retail-ink">
              {order.order_number}
            </span>
          </p>
          <OrderStatusChip status={status} />
        </div>
        <p className="mt-2 text-graphite">
          التاريخ:{" "}
          <time dateTime={order.created_at}>{formatOrderDate(order.created_at)}</time>
        </p>
        <p className="mt-1 font-bold text-retail-ink">الإجمالي: {formatMoney(order.total_piasters)}</p>
        <div className="mt-4">
          <ReorderButton orderId={order.id} />
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-[16px] font-bold text-retail-ink">المنتجات</h2>
        <ul className="space-y-3 text-sm">
          {items.map((item) => {
            const imageUrl = imageByVariant.get(item.variant_id) ?? PLACEHOLDER_PRODUCT_IMAGE;
            return (
              <li key={item.id} className="flex items-center gap-3 border-b border-mist pb-3">
                <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[8px] bg-fog">
                  <Image
                    src={imageUrl}
                    alt={item.product_name}
                    fill
                    className="object-contain p-1"
                    sizes="72px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium text-retail-ink">{item.product_name}</p>
                  <p className="text-[12px] text-graphite">الكمية: {item.quantity}</p>
                </div>
                <p className="shrink-0 text-[14px] font-bold text-retail-ink">
                  {formatMoney(item.unit_price_piasters * item.quantity)}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      {history.length > 0 ? (
        <section>
          <h2 className="mb-3 text-[16px] font-bold text-retail-ink">سجل الحالة</h2>
          <ol className="relative space-y-4 border-s border-mist ps-4">
            {history.map((entry) => (
              <li key={entry.id} className="relative">
                <span
                  aria-hidden
                  className="absolute -start-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-carbon-ink"
                />
                <p className="text-[14px] font-bold text-retail-ink">
                  {ORDER_STATUS_LABELS[entry.status as OrderStatus] ?? entry.status}
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
