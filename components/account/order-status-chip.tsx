import type { OrderStatus } from "@/lib/types/database";
import { ORDER_STATUS_LABELS } from "@/lib/account/order-status";
import { cn } from "@/lib/utils/cn";

export function OrderStatusChip({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-full border border-retail-line bg-fog px-2.5 text-[12px] font-bold text-retail-ink",
        className
      )}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
