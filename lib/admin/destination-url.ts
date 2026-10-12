export type DestinationKind = "home" | "products" | "product" | "category" | "custom";

export function inferDestinationKind(linkUrl: string): DestinationKind {
  const value = linkUrl.trim();
  if (!value || value === "/") return "home";
  if (value === "/products") return "products";
  if (value.startsWith("/products/")) return "product";
  if (value.startsWith("/categories/")) return "category";
  return "custom";
}

export function productDestinationPath(slug: string): string {
  return `/products/${slug}`;
}

export function categoryDestinationPath(slug: string): string {
  return `/categories/${slug}`;
}

export function slugFromProductPath(linkUrl: string): string {
  return linkUrl.trim().replace(/^\/products\//, "");
}

export function slugFromCategoryPath(linkUrl: string): string {
  return linkUrl.trim().replace(/^\/categories\//, "");
}
