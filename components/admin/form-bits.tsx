"use client";

import { useEffect, useId } from "react";
import { useFormStatus } from "react-dom";
import { finishOperation, startOperation } from "@/lib/loading/operations";
import { useDeferredBusy } from "@/components/loading/use-deferred-busy";
import { cn } from "@/lib/utils/cn";
import type { FormState } from "@/lib/admin/actions";

export const selectClass =
  "flex h-10 w-full rounded-[4px] border border-ash-border bg-paper-white px-3 text-[14px] text-carbon-ink";

export const initialFormState: FormState = { error: null, saved: false, notice: null };

export function FormNote({ state }: { state: FormState }) {
  if (state.error) return <p className="text-[14px] text-carbon-ink">{state.error}</p>;
  if (state.notice) return <p className="text-[14px] text-graphite">{state.notice}</p>;
  if (state.saved) return <p className="text-[14px] text-carbon-ink">تم الحفظ</p>;
  return null;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1 text-[14px]">
      <span className="text-graphite">{label}</span>
      {children}
    </label>
  );
}

export function ConfirmButton({
  message,
  children,
  variant = "ember",
}: {
  message: string;
  children: React.ReactNode;
  variant?: "ember" | "quiet";
}) {
  const { pending } = useFormStatus();
  const showFeedback = useDeferredBusy(pending);
  const operationId = useId();
  const pendingLabel = children === "حذف" ? "جارٍ الحذف" : children === "أرشفة" ? "جارٍ الأرشفة" : "جارٍ التنفيذ";

  useEffect(() => {
    if (!pending) return;
    startOperation(operationId);
    return () => finishOperation(operationId);
  }, [operationId, pending]);

  const className =
    variant === "ember"
      ? "inline-flex h-10 items-center rounded-[4px] border border-ember-red px-3 text-[14px] font-bold tracking-[0.038em] text-ember-red disabled:opacity-50"
      : "inline-flex h-10 items-center rounded-[4px] border border-ash-border px-3 text-[14px] font-bold tracking-[0.038em] text-carbon-ink disabled:opacity-50";
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      <span className="grid">
        <span className={cn("col-start-1 row-start-1", showFeedback && "invisible")} aria-hidden={showFeedback}>
          {children}
        </span>
        <span className={cn("col-start-1 row-start-1", !showFeedback && "invisible")} role="status" aria-hidden={!showFeedback}>
          {pendingLabel}
        </span>
      </span>
    </button>
  );
}
