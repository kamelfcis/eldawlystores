"use client";

import { useEffect, useId } from "react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";
import { finishOperation, startOperation, type OperationMode } from "@/lib/loading/operations";
import { cn } from "@/lib/utils/cn";
import { useDeferredBusy } from "./use-deferred-busy";

function InlineSpinner() {
  return (
    <span
      className="inline-block size-3.5 shrink-0 rounded-full border-2 border-current border-e-transparent motion-safe:animate-spin"
      aria-hidden="true"
    />
  );
}

export function LoadingButton({
  pending,
  pendingLabel = "جارٍ التنفيذ",
  operationMode = "indeterminate",
  className,
  children,
  disabled,
  ...props
}: ButtonProps & {
  pending?: boolean;
  pendingLabel?: string;
  operationMode?: OperationMode;
}) {
  const formStatus = useFormStatus();
  const busy = pending ?? formStatus.pending;
  const showFeedback = useDeferredBusy(busy);
  const operationId = useId();

  useEffect(() => {
    if (!busy) return;
    startOperation(operationId, { mode: operationMode });
    return () => finishOperation(operationId);
  }, [busy, operationId, operationMode]);

  return (
    <Button
      {...props}
      className={cn(className)}
      disabled={disabled || busy}
      aria-busy={busy}
    >
      <span className="grid">
        <span className={cn("col-start-1 row-start-1 inline-flex items-center justify-center gap-2", showFeedback && "invisible")} aria-hidden={showFeedback}>
          {children}
        </span>
        <span
          className={cn("col-start-1 row-start-1 inline-flex items-center justify-center gap-2", !showFeedback && "invisible")}
          role="status"
          aria-hidden={!showFeedback}
        >
          <InlineSpinner />
          {pendingLabel}
        </span>
      </span>
    </Button>
  );
}
