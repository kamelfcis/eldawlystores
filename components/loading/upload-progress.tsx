"use client";

import { useDeferredBusy } from "./use-deferred-busy";

export function UploadProgress({
  active,
  loaded,
  total,
}: {
  active: boolean;
  loaded: number;
  total: number;
}) {
  const show = useDeferredBusy(active);
  if (!show) return null;

  const known = total > 0;
  const ratio = known ? Math.min(1, Math.max(0, loaded / total)) : 0;
  const percent = Math.round(ratio * 100);

  return (
    <div className="space-y-1" aria-busy="true">
      <div
        className="h-0.5 overflow-hidden bg-mist"
        role={known ? "progressbar" : "status"}
        aria-valuemin={known ? 0 : undefined}
        aria-valuemax={known ? 100 : undefined}
        aria-valuenow={known ? percent : undefined}
        aria-label={known ? "تقدم رفع الصورة" : "جارٍ رفع الصورة"}
      >
        <div
          className={known ? "h-full bg-carbon-ink" : "h-full w-2/5 bg-carbon-ink motion-safe:animate-pulse"}
          style={known ? { width: `${percent}%` } : undefined}
        />
      </div>
      <p className="text-xs text-graphite" role="status">
        {known ? `${percent}%` : "جارٍ الرفع"}
      </p>
    </div>
  );
}
