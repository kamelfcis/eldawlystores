"use client";

import { useActionState } from "react";
import { saveAdminOrderStatus } from "@/lib/admin/actions";
import type { OrderStatus } from "@/lib/types/database";
import { LoadingButton } from "@/components/loading/loading-button";
import { FormNote, initialFormState, selectClass } from "./form-bits";

const statusLabels: Record<OrderStatus, string> = {
  pending: "معلق",
  confirmed: "مؤكد",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغي",
  rejected: "مرفوض",
};

export function OrderStatusForm({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [state, action] = useActionState(saveAdminOrderStatus, initialFormState);

  return (
    <form action={action} className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <input type="hidden" name="orderId" value={orderId} />
      <select name="status" defaultValue={status} className={`${selectClass} h-10 w-full sm:w-auto`} aria-label="حالة الطلب">
        {(Object.keys(statusLabels) as OrderStatus[]).map((value) => (
          <option key={value} value={value}>
            {statusLabels[value]}
          </option>
        ))}
      </select>
      <LoadingButton type="submit" pendingLabel="جارٍ الحفظ">
        حفظ
      </LoadingButton>
      <FormNote state={state} />
    </form>
  );
}

export { statusLabels as orderStatusLabels };
