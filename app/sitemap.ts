import type { MetadataRoute } from "next";
import { getCategories, getProducts } from "@/lib/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const [categories, firstPage] = await Promise.all([
    getCategories(),
    getProducts({ page: 1, pageSize: 1 }),
  ]);
  const products =
    firstPage.total <= 1
      ? firstPage.products
      : (await getProducts({ page: 1, pageSize: firstPage.total })).products;

  const productUrls = products.map((p) => ({
    url: `${baseUrl}/products/${p.slug}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const categoryUrls = categories.map((c) => ({
    url: `${baseUrl}/categories/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/products`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    ...categoryUrls,
    ...productUrls,
  ];
}
