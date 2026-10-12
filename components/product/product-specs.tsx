import type { ProductSpec } from "@/lib/catalog/product-specs";

export function ProductSpecs({ specs }: { specs: ProductSpec[] }) {
  if (specs.length === 0) return null;

  return (
    <details className="border-s-[2px] border-s-category-teal bg-paper-white ps-4" open={specs.length <= 8}>
      <summary className="cursor-pointer text-[14px] font-bold tracking-[0.038em] text-retail-ink">المواصفات</summary>
      <dl className="mt-3 divide-y divide-retail-line">
        {specs.map((spec, index) => (
          <div key={`${spec.label}-${index}`} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-3 py-2 text-[14px]">
            <dt className="min-w-0 text-retail-muted">{spec.label}</dt>
            <dd className="min-w-0 text-retail-ink">{spec.value}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
