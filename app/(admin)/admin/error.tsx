"use client";

export default function AdminSegmentError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-[1200px] rounded-[8px] border border-mist bg-paper-white p-6">
      <h1 className="text-[16px] font-bold tracking-[0.057em] text-carbon-ink">تعذر تحميل الصفحة</h1>
      <p className="mt-2 text-[14px] text-graphite">حدث خطأ أثناء قراءة البيانات. حاول مرة أخرى.</p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-4 inline-flex h-8 items-center rounded-[4px] bg-carbon-ink px-3 text-[14px] font-bold tracking-[0.038em] text-paper-white"
      >
        إعادة المحاولة
      </button>
    </div>
  );
}
