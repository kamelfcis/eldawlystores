"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface ProfileSummary {
  id: string;
  full_name: string | null;
  phone: string | null;
}

export function useProfile(userId: string | null) {
  return useQuery({
    queryKey: ["profile", userId],
    staleTime: 2 * 60 * 1000,
    enabled: Boolean(userId) && isSupabaseConfigured(),
    queryFn: async (): Promise<ProfileSummary | null> => {
      if (!userId) return null;
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw new Error("Failed to fetch profile");
      return data as ProfileSummary | null;
    },
  });
}
