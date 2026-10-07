"use client";

import { useEffect } from "react";

export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h2 className="text-2xl font-bold text-carbon-ink">حدث خطأ</h2>
      <p className="max-w-md text-graphite">
        تعذر تحميل الصفحة. يرجى المحاولة مرة أخرى.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-[4px] bg-carbon-ink px-5 py-3 text-sm font-bold tracking-[0.057em] text-paper-white"
      >
        إعادة المحاولة
      </button>
    </div>
  );
}
