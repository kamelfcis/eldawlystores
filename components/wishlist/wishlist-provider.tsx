"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "doly-wishlist-ids";

type WishlistContextValue = {
  ids: string[];
  has: (productId: string) => boolean;
  toggle: (productId: string) => void;
  list: () => string[];
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

function readStoredIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return [];
  }
}

function writeStoredIds(ids: string[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setIds(readStoredIds());
    setReady(true);
  }, []);

  const toggle = useCallback((productId: string) => {
    setIds((current) => {
      const next = current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId];
      writeStoredIds(next);
      return next;
    });
  }, []);

  const has = useCallback((productId: string) => ids.includes(productId), [ids]);

  const list = useCallback(() => ids, [ids]);

  const value = useMemo<WishlistContextValue>(
    () => ({
      ids: ready ? ids : [],
      has,
      toggle,
      list,
    }),
    [ready, ids, has, toggle, list]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
