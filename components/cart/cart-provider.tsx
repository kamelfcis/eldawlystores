"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Cart } from "@/lib/cart/types";
import {
  getCartScopeId,
  addToCart as addItem,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  getCartItemCount,
  getCartTotal,
} from "@/lib/cart/store";
import type { CartItem } from "@/lib/cart/types";
import { useCartQuery } from "@/hooks/use-cart-query";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

interface CartContextValue {
  cart: Cart;
  itemCount: number;
  totalPiasters: number;
  addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const emptyCart = (): Cart => ({ items: [], updatedAt: new Date().toISOString() });

async function resolveCartScopeId(): Promise<string> {
  const sessionId = getCartScopeId();
  if (!isSupabaseConfigured()) return sessionId;
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.user.id || sessionId;
  } catch {
    return sessionId;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [scopeId, setScopeId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void resolveCartScopeId().then((id) => {
      if (active && id) setScopeId(id);
    });
    return () => {
      active = false;
    };
  }, []);

  const { data } = useCartQuery(scopeId);
  const cart = data ?? emptyCart();

  const write = useCallback(
    (next: Cart) => {
      if (!scopeId) return;
      queryClient.setQueryData(["cart", scopeId], next);
    },
    [queryClient, scopeId]
  );

  const value: CartContextValue = {
    cart: scopeId ? cart : emptyCart(),
    itemCount: scopeId && data ? getCartItemCount(data) : 0,
    totalPiasters: scopeId && data ? getCartTotal(data) : 0,
    addToCart: (item, qty) => write(addItem(item, qty)),
    updateQuantity: (variantId, qty) => write(updateCartItemQuantity(variantId, qty)),
    removeItem: (variantId) => write(removeFromCart(variantId)),
    clear: () => write(clearCart()),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
