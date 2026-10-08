"use client";

import { useEffect, useSyncExternalStore, type CSSProperties } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ROUTE_OPERATION_ID,
  finishOperation,
  getProgressSnapshot,
  getServerProgressSnapshot,
  subscribeProgress,
} from "@/lib/loading/operations";
import { installRouteSignals } from "@/lib/loading/route-signals";

function liveLabel(mode: "indeterminate" | "determinate", ratio: number | null) {
  if (mode === "determinate" && ratio != null) {
    const step = Math.floor(ratio * 4) * 25;
    return `رفع ${step}٪`;
  }
  return "جارٍ التحميل";
}

export function ProgressBar() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const progress = useSyncExternalStore(subscribeProgress, getProgressSnapshot, getServerProgressSnapshot);
  const accent = pathname.startsWith("/admin") ? "#1a211e" : "#a92222";

  useEffect(() => installRouteSignals(), []);

  useEffect(() => {
    finishOperation(ROUTE_OPERATION_ID);
  }, [pathname, search]);

  if (!progress.visible || progress.mode === "idle") return null;

  const determinate = progress.mode === "determinate" && progress.ratio != null;
  const percent = determinate ? Math.round((progress.ratio ?? 0) * 100) : undefined;

  return (
    <div
      className="doly-progress"
      style={{ "--doly-progress-accent": accent } as CSSProperties}
      role={determinate ? "progressbar" : "status"}
      aria-live="polite"
      aria-busy="true"
      aria-valuemin={determinate ? 0 : undefined}
      aria-valuemax={determinate ? 100 : undefined}
      aria-valuenow={percent}
      aria-label={determinate ? "تقدم الرفع" : "جارٍ التحميل"}
    >
      <div
        className={determinate ? "doly-progress__determinate" : "doly-progress__indeterminate"}
        style={determinate ? { width: `${percent}%` } : undefined}
      />
      <span className="sr-only">{liveLabel(progress.mode, progress.ratio)}</span>
    </div>
  );
}
