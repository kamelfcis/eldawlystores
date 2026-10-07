"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ProductsError({
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
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <h2 className="text-xl font-bold text-carbon-ink">تعذر عرض المنتجات</h2>
      <p className="max-w-md text-graphite">
        حدث خطأ أثناء تحميل المنتجات. يرجى المحاولة مرة أخرى.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-[4px] bg-carbon-ink px-5 py-3 text-sm font-bold tracking-[0.057em] text-paper-white"
        >
          إعادة المحاولة
        </button>
        <Link
          href="/"
          className="rounded-[4px] border border-ash-border px-5 py-3 text-sm font-bold tracking-[0.057em] text-carbon-ink"
        >
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
