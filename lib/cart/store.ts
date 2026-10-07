"use client";

import type { Cart, CartItem } from "./types";

const CART_KEY = "doly-cart";
const CART_SCOPE_KEY = "doly-cart-scope";

export function getCartScopeId(): string {
  if (typeof window === "undefined") return "";
  const existing = localStorage.getItem(CART_SCOPE_KEY);
  if (existing) return existing;
  const created = crypto.randomUUID();
  localStorage.setItem(CART_SCOPE_KEY, created);
  return created;
}

export function getCart(): Cart {
  if (typeof window === "undefined") return { items: [], updatedAt: new Date().toISOString() };
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return { items: [], updatedAt: new Date().toISOString() };
    return JSON.parse(raw) as Cart;
  } catch {
    return { items: [], updatedAt: new Date().toISOString() };
  }
}

export function saveCart(cart: Cart): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_KEY, JSON.stringify({ ...cart, updatedAt: new Date().toISOString() }));
}

export function addToCart(item: Omit<CartItem, "quantity">, quantity = 1): Cart {
  const cart = getCart();
  const existing = cart.items.find((i) => i.variantId === item.variantId);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + quantity, item.stock);
  } else {
    cart.items.push({ ...item, quantity: Math.min(quantity, item.stock) });
  }
  saveCart(cart);
  return cart;
}

export function updateCartItemQuantity(variantId: string, quantity: number): Cart {
  const cart = getCart();
  const item = cart.items.find((i) => i.variantId === variantId);
  if (item) {
    if (quantity <= 0) {
      cart.items = cart.items.filter((i) => i.variantId !== variantId);
    } else {
      item.quantity = Math.min(quantity, item.stock);
    }
  }
  saveCart(cart);
  return cart;
}

export function removeFromCart(variantId: string): Cart {
  const cart = getCart();
  cart.items = cart.items.filter((i) => i.variantId !== variantId);
  saveCart(cart);
  return cart;
}

export function clearCart(): Cart {
  const cart = { items: [], updatedAt: new Date().toISOString() };
  saveCart(cart);
  return cart;
}

export function getCartTotal(cart: Cart): number {
  return cart.items.reduce((sum, item) => sum + item.unitPricePiasters * item.quantity, 0);
}

export function getCartItemCount(cart: Cart): number {
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}
