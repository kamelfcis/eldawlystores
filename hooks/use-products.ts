"use client";

import { useQuery } from "@tanstack/react-query";
import type { ProductFilters } from "@/lib/catalog";

async function fetchProducts(filters: ProductFilters) {
  const params = new URLSearchParams();
  if (filters.categorySlug) params.set("category", filters.categorySlug);
  if (filters.search) params.set("search", filters.search);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.page) params.set("page", String(filters.page));
  const res = await fetch(`/api/products?${params}`);
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => fetchProducts(filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const res = await fetch(`/api/products/${slug}`);
      if (!res.ok) throw new Error("Product not found");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(slug),
  });
}
