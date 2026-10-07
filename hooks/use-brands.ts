"use client";

import { useQuery } from "@tanstack/react-query";
import { mockBrands } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function useBrands() {
  return useQuery({
    queryKey: ["brands"],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      if (!isSupabaseConfigured()) return mockBrands;
      const supabase = createClient();
      const { data, error } = await supabase
        .from("brands")
        .select("id, name, slug, logo_url, created_at")
        .order("name");
      if (error) throw new Error("Failed to fetch brands");
      return data ?? [];
    },
  });
}
