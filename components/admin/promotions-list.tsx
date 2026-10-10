"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DeletePromotionForm } from "@/components/admin/catalog-forms";
import {
  AdminEmpty,
  AdminList,
  AdminListCell,
  AdminListRow,
  StatusPill,
  adminFilterChipClass,
} from "@/components/admin/admin-ui";
import { formatMoney } from "@/lib/money";
import type { AdminPromotionRow } from "@/lib/admin/queries";
import {
  filterPromotionsByStatus,
  promotionStatusLabel,
  type PromotionListFilter,
} from "@/lib/admin/promotion-status";

const promotionColumns = "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto]";

const FILTERS: Array<{ id: PromotionListFilter; label: string }> = [
  { id: "all", label: "الكل" },
  { id: "active", label: "نشط" },
  { id: "disabled", label: "معطّل" },
  { id: "expired", label: "منتهٍ" },
];

export function PromotionsList({ promotions }: { promotions: AdminPromotionRow[] }) {
  const [filter, setFilter] = useState<PromotionListFilter>("all");
  const rows = useMemo(() => filterPromotionsByStatus(promotions, filter), [filter, promotions]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={adminFilterChipClass(filter === item.id)}
            aria-pressed={filter === item.id}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {rows.length === 0 ? (
        <AdminEmpty>لا توجد عروض بهذه الحالة.</AdminEmpty>
      ) : (
        <AdminList
          columns={["الكود", "الخصم", "الحد الأدنى", "الاستخدام", "الحالة", "إجراء"]}
          gridClass={promotionColumns}
        >
          {rows.map((promotion) => (
            <AdminListRow key={promotion.id} gridClass={promotionColumns}>
              <AdminListCell label="الكود">
                <span className="font-mono text-carbon-ink" dir="ltr">
                  {promotion.code}
                </span>
              </AdminListCell>
              <AdminListCell label="الخصم">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full border border-ash-border bg-fog px-2 py-0.5 text-[12px] text-pewter">
                    {promotion.discount_type === "percentage" ? "نسبة" : "ثابت"}
                  </span>
                  <span className="text-carbon-ink">
                    {promotion.discount_type === "percentage"
                      ? `${promotion.discount_value}%`
                      : formatMoney(promotion.discount_value)}
                  </span>
                </span>
              </AdminListCell>
              <AdminListCell label="الحد الأدنى">
                {promotion.min_order_piasters === 0 ? "—" : formatMoney(promotion.min_order_piasters)}
              </AdminListCell>
              <AdminListCell label="الاستخدام">
                {promotion.used_count} / {promotion.max_uses ?? "بدون حد"}
              </AdminListCell>
              <AdminListCell label="الحالة">
                <StatusPill>{promotionStatusLabel(promotion)}</StatusPill>
              </AdminListCell>
              <AdminListCell label="إجراء">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/promotions?edit=${promotion.id}`}
                    className="inline-flex h-10 items-center font-bold tracking-[0.038em] text-carbon-ink underline-offset-2 hover:underline"
                  >
                    تعديل
                  </Link>
                  <DeletePromotionForm id={promotion.id} />
                </div>
              </AdminListCell>
            </AdminListRow>
          ))}
        </AdminList>
      )}
    </div>
  );
}
