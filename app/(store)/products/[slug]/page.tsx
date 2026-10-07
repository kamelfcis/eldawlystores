import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { ProductPrice, stockLabel } from "@/components/product/product-price";
import { ProductGrid } from "@/components/product/product-grid";
import { ProductGallery } from "@/components/product/product-gallery";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { CompareButton } from "@/components/compare/compare-button";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "منتج غير موجود" };
  return { title: product.name_ar, description: product.description_ar ?? undefined };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const variant = product.defaultVariant;
  const related = await getRelatedProducts(product.id);

  const breadcrumbItems = [
    { label: "الرئيسية", href: "/" },
    ...(product.category
      ? [{ label: product.category.name_ar, href: `/categories/${product.category.slug}` }]
      : []),
    { label: product.name_ar },
  ];

  return (
    <div className="space-y-10">
      <Breadcrumb items={breadcrumbItems} />
      <div className="grid md:grid-cols-2 gap-8">
        <ProductGallery
          productName={product.name_ar}
          images={product.images.map((image) => ({
            id: image.id,
            url: image.url,
            alt_text: image.alt_text,
          }))}
        />

        <div className="space-y-4">
          {product.brand && (
            <p className="text-sm text-graphite">{product.brand.name}</p>
          )}
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold">{product.name_ar}</h1>
            <div className="flex shrink-0 items-center gap-2">
              <CompareButton productId={product.id} showLabel />
              <WishlistButton productId={product.id} />
            </div>
          </div>
          {product.rating && (
            <p className="text-sm text-graphite">★ {product.rating.toFixed(1)}</p>
          )}

          <ProductPrice
            pricePiasters={variant.price_piasters}
            compareAtPiasters={variant.compare_at_piasters}
            size="page"
          />

          <p className="font-mono text-xs text-graphite">SKU: {variant.sku}</p>
          <p className="text-sm text-retail-muted">{stockLabel(variant.stock)}</p>

          {product.description_ar && (
            <p className="text-sm text-graphite leading-relaxed">{product.description_ar}</p>
          )}

          {product.variants.length > 1 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">الخيارات:</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <span
                    key={v.id}
                    className={`rounded-full px-3 py-1 text-xs border ${
                      v.is_default ? "bg-carbon-ink text-paper-white border-carbon-ink" : "border-ash-border"
                    }`}
                  >
                    {v.sku.split("-").pop()}
                  </span>
                ))}
              </div>
            </div>
          )}

          <AddToCartButton product={product} variant={variant} />
        </div>
      </div>

      {related.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">منتجات ذات صلة</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
