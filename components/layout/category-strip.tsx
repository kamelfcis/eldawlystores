import Link from "next/link";
import type { Category } from "@/lib/types/database";

export function CategoryStrip({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return null;

  return (
    <nav aria-label="الأقسام" className="hidden border-b border-mist bg-paper-white lg:block">
      <div className="mx-auto flex h-10 w-full max-w-[1440px] items-center gap-5 overflow-x-auto px-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            className="shrink-0 text-[14px] font-bold tracking-[0.038em] text-slate hover:text-retail-ink"
          >
            {category.name_ar}
          </Link>
        ))}
        <Link href="/categories" className="ms-auto shrink-0 text-[14px] font-bold tracking-[0.038em] text-retail-ink">
          عرض الكل
        </Link>
      </div>
    </nav>
  );
}
