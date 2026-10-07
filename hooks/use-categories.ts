"use client";

import { useQuery } from "@tanstack/react-query";
import { mockCategories } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      if (!isSupabaseConfigured()) return mockCategories;
      const supabase = createClient();
      const { data, error } = await supabase
        .from("categories")
        .select("id, name_ar, slug, description_ar, image_url, sort_order, created_at")
        .order("sort_order");
      if (error) throw new Error("Failed to fetch categories");
      return data ?? [];
    },
  });
}
