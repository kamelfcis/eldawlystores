import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AdminEmpty,
  AdminError,
  AdminList,
  AdminListCell,
  AdminListRow,
  AdminPage,
  StatusPill,
  formatAdminTime,
} from "@/components/admin/admin-ui";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { customerTelHref, customerWhatsAppHref } from "@/lib/orders/customer-contact";
import { allowedOrderStatuses, getAdminOrder, type AdminOrderDetail, type AdminOrderHistoryEntry } from "@/lib/orders";
import { formatMoney } from "@/lib/money";
import type { OrderStatus } from "@/lib/types/database";

const statusLabels: Record<OrderStatus, string> = {
  pending: "معلق",
  confirmed: "مؤكد",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
  rejected: "مرفوض",
};

const statusColors: Record<OrderStatus, string> = {
  pending: "#c47b12",
  confirmed: "#1d4e89",
  shipped: "#0f6e6b",
  delivered: "#5c4d8a",
  cancelled: "#cc2e39",
  rejected: "#cc2e39",
};

const itemColumns = "lg:grid-cols-[2fr_1fr_0.7fr_1fr_1fr]";

const contactLinkClass =
  "inline-flex min-h-10 items-center font-bold tracking-[0.038em] text-carbon-ink underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-carbon-ink";

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { order, error } = await getAdminOrder(id);
  if (!order && !error) notFound();

  return (
    <AdminPage
      title={
        order ? (
          <span className="font-mono" dir="ltr">
            {order.orderNumber}
          </span>
        ) : (
          "الطلب"
        )
      }
      accentColor={order ? statusColors[order.status] : undefined}
      breadcrumb={
        order ? (
          <nav className="text-[14px] text-graphite" aria-label="مسار التنقل">
            <Link
              href="/admin/orders"
              className="text-carbon-ink underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-carbon-ink"
            >
              الطلبات
            </Link>
            <span> · </span>
            <span className="font-mono text-carbon-ink" dir="ltr">
              {order.orderNumber}
            </span>
          </nav>
        ) : null
      }
      meta={
        order ? (
          <div className="flex flex-wrap items-baseline gap-2">
            <p className="text-[14px] text-graphite">
              {formatAdminTime(order.createdAt)} · {order.items.length} أصناف
            </p>
            <p className="text-[16px] font-bold text-carbon-ink">{formatMoney(order.totalPiasters)}</p>
          </div>
        ) : null
      }
      action={
        <div className="flex flex-wrap items-center gap-2">
          {order ? <StatusPill color={statusColors[order.status]}>{statusLabels[order.status]}</StatusPill> : null}
          <Link
            href="/admin/orders"
            className="inline-flex h-10 items-center rounded-[4px] border border-carbon-ink px-3 text-[14px] font-bold tracking-[0.038em] text-carbon-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-carbon-ink"
          >
            العودة إلى الطلبات
          </Link>
        </div>
      }
    >
      <AdminError message={error} />
      {!order ? (
        <AdminEmpty>تعذر عرض الطلب.</AdminEmpty>
      ) : (
        <>
          <div>
            <OrderStatusForm
              orderId={order.id}
              status={order.status}
              allowedStatuses={allowedOrderStatuses(order.status)}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <ItemsCard order={order} />
            <aside className="rounded-[8px] border border-mist bg-paper-white p-4 text-[14px]">
              <CustomerBlock order={order} />
              <ShippingBlock lines={order.addressLines} />
              <HistoryBlock entries={order.history} />
            </aside>
          </div>
        </>
      )}
    </AdminPage>
  );
}

function ItemsCard({ order }: { order: AdminOrderDetail }) {
  return (
    <section className="rounded-[8px] border border-mist bg-paper-white p-4">
      <h2 className="text-[14px] font-bold tracking-[0.038em]">الأصناف</h2>
      {order.items.length === 0 ? (
        <p className="mt-3 text-[14px] text-graphite">لا توجد أصناف.</p>
      ) : (
        <div className="mt-3">
          <AdminList columns={["المنتج", "SKU", "الكمية", "سعر الوحدة", "الإجمالي"]} gridClass={itemColumns} flush>
            {order.items.map((item) => {
              const sku = item.sku.trim() || "—";
              const lineTotal = item.quantity * item.unitPricePiasters;
              return (
                <AdminListRow key={item.id} gridClass={itemColumns}>
                  <AdminListCell label="المنتج">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative size-[72px] shrink-0 overflow-hidden rounded-[8px] bg-fog outline outline-1 outline-offset-[-1px] outline-mist">
                        <Image
                          src={item.imageUrl}
                          alt=""
                          fill
                          className="object-contain p-1"
                          sizes="72px"
                        />
                      </div>
                      <p className="min-w-0 break-words text-carbon-ink">{item.productName}</p>
                    </div>
                  </AdminListCell>
                  <AdminListCell label="SKU">
                    <p className="break-all font-mono text-graphite" dir="ltr">
                      {sku}
                    </p>
                  </AdminListCell>
                  <AdminListCell label="الكمية">
                    <p className="text-carbon-ink">{item.quantity}</p>
                  </AdminListCell>
                  <AdminListCell label="سعر الوحدة">
                    <p className="text-carbon-ink">{formatMoney(item.unitPricePiasters)}</p>
                  </AdminListCell>
                  <AdminListCell label="الإجمالي">
                    <p className="text-carbon-ink">{formatMoney(lineTotal)}</p>
                  </AdminListCell>
                </AdminListRow>
              );
            })}
          </AdminList>
        </div>
      )}
      <div className="mt-4 space-y-2 border-t border-mist pt-4 text-[14px]">
        <div className="flex justify-between gap-3 text-graphite">
          <p>فرعي</p>
          <p>{formatMoney(order.subtotalPiasters)}</p>
        </div>
        <div className="flex justify-between gap-3 text-graphite">
          <p>شحن</p>
          <p>{formatMoney(order.shippingPiasters)}</p>
        </div>
        <div className="flex justify-between gap-3 text-graphite">
          <p>خصم</p>
          <p>{formatMoney(order.discountPiasters)}</p>
        </div>
        <div className="flex justify-between gap-3 text-[16px] font-bold text-carbon-ink">
          <p>الإجمالي</p>
          <p>{formatMoney(order.totalPiasters)}</p>
        </div>
      </div>
    </section>
  );
}

function CustomerBlock({ order }: { order: AdminOrderDetail }) {
  const telHref = customerTelHref(order.customerPhone);
  const whatsappHref = customerWhatsAppHref(order.customerPhone);
  const email = order.customerEmail.trim();

  return (
    <div>
      <h2 className="text-[14px] font-bold tracking-[0.038em]">العميل</h2>
      <div className="mt-3 space-y-2">
        <p className="text-carbon-ink">{order.customerName}</p>
        {telHref ? (
          <p>
            <a href={telHref} className={contactLinkClass} dir="ltr">
              {order.customerPhone}
            </a>
          </p>
        ) : order.customerPhone.trim() ? (
          <p className="text-carbon-ink" dir="ltr">
            {order.customerPhone}
          </p>
        ) : null}
        {whatsappHref ? (
          <p>
            <a href={whatsappHref} className={contactLinkClass} target="_blank" rel="noopener noreferrer">
              واتساب
            </a>
          </p>
        ) : null}
        {email ? (
          <p className="break-all">
            <a href={`mailto:${email}`} className={`${contactLinkClass} break-all`}>
              {email}
            </a>
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ShippingBlock({ lines }: { lines: string[] }) {
  return (
    <div className="mt-4 border-t border-mist pt-4">
      <h2 className="text-[14px] font-bold tracking-[0.038em]">الشحن</h2>
      <div className="mt-3">
        {lines.length === 0 ? (
          <p className="text-graphite">لا يوجد عنوان.</p>
        ) : (
          <ul className="space-y-1" role="list">
            {lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function HistoryBlock({ entries }: { entries: AdminOrderHistoryEntry[] }) {
  return (
    <div className="mt-4 border-t border-mist pt-4">
      <h2 className="text-[14px] font-bold tracking-[0.038em]">سجل الحالة</h2>
      {entries.length === 0 ? (
        <p className="mt-3 text-[14px] text-graphite">لا يوجد سجل بعد.</p>
      ) : (
        <ol className="relative mt-3 space-y-4 border-s border-mist ps-4" role="list">
          {entries.map((entry) => (
            <li key={entry.id} className="relative">
              <span
                aria-hidden
                className="absolute -start-[21px] top-1.5 size-2.5 rounded-full"
                style={{ backgroundColor: statusColors[entry.status] }}
              />
              <StatusPill color={statusColors[entry.status]}>{statusLabels[entry.status]}</StatusPill>
              <p className="mt-1 text-graphite">{formatAdminTime(entry.createdAt)}</p>
              {entry.note ? <p className="mt-1">{entry.note}</p> : null}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
