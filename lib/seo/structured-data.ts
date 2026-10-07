import type { ProductWithDetails } from "@/lib/types/database";
import { piastersToPounds } from "@/lib/money";

export function productJsonLd(product: ProductWithDetails, baseUrl: string) {
  const variant = product.defaultVariant;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name_ar,
    description: product.description_ar,
    image: product.images[0]?.url,
    brand: product.brand ? { "@type": "Brand", name: product.brand.name } : undefined,
    sku: variant.sku,
    offers: {
      "@type": "Offer",
      price: piastersToPounds(variant.price_piasters),
      priceCurrency: "EGP",
      availability: variant.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${baseUrl}/products/${product.slug}`,
    },
  };
}

export function organizationJsonLd(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Doly Stores",
    url: baseUrl,
    description: "متجر إلكترونيات مصري",
  };
}
