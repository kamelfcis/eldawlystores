import Link from "next/link";
import { getCategories } from "@/lib/catalog";

export const metadata = { title: "الأقسام" };

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div dir="rtl" className="min-w-0">
      <h1 className="text-[24px] font-bold text-retail-ink">الأقسام</h1>
      {categories.length === 0 ? (
        <p className="mt-6 border-t border-retail-line pt-6 text-[16px] text-retail-ink">لا توجد أقسام حالياً.</p>
      ) : (
        <ul className="mt-6 divide-y divide-retail-line border-y border-retail-line">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={`/categories/${category.slug}`}
                className="block py-4 text-[16px] text-retail-ink focus-visible:outline focus-visible:outline-1 focus-visible:outline-retail-ink"
              >
                {category.name_ar}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
