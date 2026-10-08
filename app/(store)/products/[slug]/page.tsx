import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { ProductPrice, stockLabel } from "@/components/product/product-price";
import { ProductGrid } from "@/components/product/product-grid";
import { ProductGallery } from "@/components/product/product-gallery";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { CompareButton } from "@/components/compare/compare-button";
import { Button } from "@/components/ui/button";
import { getStoreWhatsapp } from "@/lib/store-settings";

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
  const [related, whatsapp] = await Promise.all([getRelatedProducts(product.id), getStoreWhatsapp()]);
  const whatsappHref = whatsapp
    ? `https://wa.me/20${whatsapp.slice(1)}?text=${encodeURIComponent(`مرحبا، أريد الاستفسار عن ${product.name_ar}`)}`
    : null;

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

        <div className="space-y-6">
          {product.brand ? (
            <p className="text-[14px] font-bold tracking-[0.038em] text-retail-muted">{product.brand.name}</p>
          ) : null}
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-[28px] font-bold leading-[1.15] text-retail-ink sm:text-[32px]">{product.name_ar}</h1>
            <div className="flex shrink-0 items-center gap-2">
              <CompareButton productId={product.id} showLabel />
              <WishlistButton productId={product.id} />
            </div>
          </div>
          {product.rating ? (
            <p className="text-[14px] text-graphite">★ {product.rating.toFixed(1)}</p>
          ) : null}

          <div className="space-y-2 border-y border-retail-line py-4">
            <ProductPrice
              pricePiasters={variant.price_piasters}
              compareAtPiasters={variant.compare_at_piasters}
              size="page"
            />
            <p className="text-[14px] text-retail-muted">{stockLabel(variant.stock)}</p>
            <p className="font-mono text-[12px] text-graphite">SKU: {variant.sku}</p>
          </div>

          {product.variants.length > 1 ? (
            <div className="space-y-2">
              <p className="text-[14px] font-bold text-retail-ink">الخيارات</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <span
                    key={v.id}
                    className={`rounded-full px-3 py-1 text-[12px] border ${
                      v.is_default ? "border-carbon-ink bg-carbon-ink text-paper-white" : "border-ash-border text-retail-ink"
                    }`}
                  >
                    {v.sku.split("-").pop()}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <AddToCartButton product={product} variant={variant} />
            {whatsappHref ? (
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href={whatsappHref} target="_blank" rel="noopener noreferrer">
                  استفسار عبر واتساب
                </Link>
              </Button>
            ) : null}
          </div>

          {product.description_ar ? (
            <div className="space-y-2">
              <h2 className="text-[16px] font-bold text-retail-ink">الوصف</h2>
              <p className="text-[14px] leading-relaxed text-graphite">{product.description_ar}</p>
            </div>
          ) : null}
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
