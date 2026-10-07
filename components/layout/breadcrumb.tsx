import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

/** RTL trail: graphite separators, retail-ink links. No card wrapper. */
export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="مسار التنقل" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1 text-[14px]">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {index > 0 ? (
                <ChevronLeft className="h-3.5 w-3.5 shrink-0 text-graphite" aria-hidden strokeWidth={1.5} />
              ) : null}
              {item.href && !isLast ? (
                <Link href={item.href} className="text-retail-ink hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? "text-graphite" : "text-retail-ink"} aria-current={isLast ? "page" : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
