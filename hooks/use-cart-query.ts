"use client";

import { useQuery } from "@tanstack/react-query";
import { getCart } from "@/lib/cart/store";

export function useCartQuery(scopeId: string | null) {
  return useQuery({
    queryKey: ["cart", scopeId],
    queryFn: () => getCart(),
    staleTime: 30 * 1000,
    enabled: Boolean(scopeId),
  });
}
