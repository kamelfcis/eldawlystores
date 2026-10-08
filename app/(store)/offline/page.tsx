import Link from "next/link";

export const metadata = { title: "بدون اتصال" };

export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h1 className="text-[24px] font-bold tracking-[0.038em] text-retail-ink">أنت غير متصل</h1>
      <p className="mt-4 text-[16px] text-retail-muted">
        واجهة المتجر والكتالوج المعروض قد تكون قديمة من آخر زيارة. لا يمكن إتمام الطلبات أو الدفع وأنت بدون اتصال.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-10 items-center rounded-[4px] bg-carbon-ink px-4 text-[14px] font-bold tracking-[0.038em] text-paper-white"
      >
        العودة للمتجر
      </Link>
    </div>
  );
}
