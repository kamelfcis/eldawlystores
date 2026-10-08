import Link from "next/link";
import { getBanners, getCategories, getCategoryProductRails } from "@/lib/catalog";
import { CategoryRail } from "@/components/home/category-rail";
import { HeroSection } from "@/components/home/hero-section";
import { ProductRail } from "@/components/product/product-rail";

function byOrder<T extends { sort_order: number; id: string }>(rows: T[]) {
  return [...rows].sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));
}

const sectionRule = "mt-10 border-t border-retail-line pt-10 lg:mt-12 lg:pt-12";
const categoryRule = "mt-2 border-t border-retail-line pt-2";

export default async function HomePage() {
  const [banners, categories, rails] = await Promise.all([
    getBanners(),
    getCategories(),
    getCategoryProductRails(),
  ]);

  const heroes = byOrder(banners.filter((banner) => banner.type === "hero"));
  const offers = byOrder(banners.filter((banner) => banner.type === "offer"));
  const showHero = [...heroes, ...offers].some((banner) => (banner.image_url?.trim() ?? "").length > 0);
  const showCategories = categories.length > 0;

  return (
    <div className="min-w-0">
      {showHero ? <HeroSection heroes={heroes} offers={offers} /> : null}
      {showCategories ? (
        <section className={showHero ? categoryRule : undefined} aria-label="تسوق حسب القسم">
          <h2 className="mb-2 text-[16px] font-bold tracking-[0.038em] text-retail-ink">تسوق حسب القسم</h2>
          <CategoryRail categories={categories} />
        </section>
      ) : null}
      {rails.map((rail, index) => {
        const separated = showHero || showCategories || index > 0;
        return (
          <section
            key={rail.category.id}
            className={separated ? `min-w-0 ${sectionRule}` : "min-w-0"}
          >
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <h2 className="min-w-0 break-words text-[24px] font-bold leading-[1.2] text-retail-ink">{rail.category.name_ar}</h2>
              <Link href={`/categories/${rail.category.slug}`} className="shrink-0 text-[14px] font-bold text-retail-ink">
                عرض الكل
              </Link>
            </div>
            <ProductRail products={rail.products} />
          </section>
        );
      })}
    </div>
  );
}
