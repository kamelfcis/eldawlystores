"use client";

import { useActionState } from "react";
import { saveAdminOrderStatus } from "@/lib/admin/actions";
import type { OrderStatus } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
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
  const [state, action, pending] = useActionState(saveAdminOrderStatus, initialFormState);

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="orderId" value={orderId} />
      <select name="status" defaultValue={status} className={`${selectClass} h-8 w-auto`} aria-label="حالة الطلب">
        {(Object.keys(statusLabels) as OrderStatus[]).map((value) => (
          <option key={value} value={value}>
            {statusLabels[value]}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" disabled={pending}>
        حفظ
      </Button>
      <FormNote state={state} />
    </form>
  );
}

export { statusLabels as orderStatusLabels };
