import { notFound } from "next/navigation";
import { getCategoryBySlug, getProducts, getCategories } from "@/lib/catalog";
import { ProductGrid } from "@/components/product/product-grid";
import { CategoryPills } from "@/components/layout/category-pills";
import { Breadcrumb } from "@/components/layout/breadcrumb";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; sort?: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "فئة غير موجودة" };
  return { title: category.name_ar };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const [result, categories] = await Promise.all([
    getProducts({ categorySlug: slug, page: Number(sp.page) || 1, sort: sp.sort as "price_asc" | undefined }),
    getCategories(),
  ]);

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "الرئيسية", href: "/" },
          { label: category.name_ar },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold">{category.name_ar}</h1>
        {category.description_ar && (
          <p className="text-graphite mt-1">{category.description_ar}</p>
        )}
      </div>
      <CategoryPills categories={categories} activeSlug={slug} />
      <ProductGrid products={result.products} />
    </div>
  );
}
