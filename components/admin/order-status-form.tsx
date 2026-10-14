"use client";

import { useActionState, useState } from "react";
import { saveAdminOrderStatus } from "@/lib/admin/actions";
import { allowedOrderStatuses } from "@/lib/orders/transitions";
import type { OrderStatus } from "@/lib/types/database";
import { LoadingButton } from "@/components/loading/loading-button";
import { useFormToast } from "@/lib/feedback/use-form-toast";
import { initialFormState, selectClass } from "./form-bits";

const statusLabels: Record<OrderStatus, string> = {
  pending: "معلق",
  confirmed: "مؤكد",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
  rejected: "مرفوض",
};

export function OrderStatusForm({
  orderId,
  status,
  allowedStatuses,
}: {
  orderId: string;
  status: OrderStatus;
  allowedStatuses?: OrderStatus[];
}) {
  const [state, action] = useActionState(saveAdminOrderStatus, initialFormState);
  useFormToast(state, "تم تحديث حالة الطلب");
  const options = allowedStatuses ?? allowedOrderStatuses(status);
  const terminal = options.length <= 1;
  const [selected, setSelected] = useState(status);
  const unchanged = selected === status;

  return (
    <form action={action} className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <input type="hidden" name="orderId" value={orderId} />
      <select
        name="status"
        value={selected}
        onChange={(event) => setSelected(event.target.value as OrderStatus)}
        disabled={terminal}
        className={`${selectClass} h-10 w-full sm:w-auto disabled:opacity-50`}
        aria-label="حالة الطلب"
      >
        {options.map((value) => (
          <option key={value} value={value}>
            {statusLabels[value]}
          </option>
        ))}
      </select>
      <LoadingButton type="submit" pendingLabel="جارٍ الحفظ" disabled={terminal || unchanged}>
        حفظ
      </LoadingButton>
      {terminal ? <p className="text-[14px] text-graphite">لا يمكن تغيير الحالة</p> : null}
    </form>
  );
}

export { statusLabels as orderStatusLabels };
