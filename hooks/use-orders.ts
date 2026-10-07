"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { OrderStatus } from "@/lib/types/database";

export interface CustomerOrderSummary {
  id: string;
  order_number: string;
  status: OrderStatus;
  total_piasters: number;
  created_at: string;
}

export function useOrders(userId: string | null) {
  return useQuery({
    queryKey: ["orders", userId],
    staleTime: 60 * 1000,
    enabled: Boolean(userId) && isSupabaseConfigured(),
    queryFn: async (): Promise<CustomerOrderSummary[]> => {
      if (!userId) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, status, total_piasters, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw new Error("Failed to fetch orders");
      return (data ?? []) as CustomerOrderSummary[];
    },
  });
}
