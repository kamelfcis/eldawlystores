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

export const MAX_COMPARE = 3;
const STORAGE_KEY = "doly-compare-ids";

export type CompareAddResult = "added" | "exists" | "limit";

type CompareContextValue = {
  ids: string[];
  ready: boolean;
  has: (productId: string) => boolean;
  add: (productId: string) => CompareAddResult;
  remove: (productId: string) => void;
  clear: () => void;
  setIds: (ids: string[]) => void;
};

const CompareContext = createContext<CompareContextValue | null>(null);

function normalizeIds(ids: string[]): string[] {
  return [...new Set(ids.filter((id) => typeof id === "string" && id.length > 0))].slice(0, MAX_COMPARE);
}

function readStoredIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return normalizeIds(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return [];
  }
}

function writeStoredIds(ids: string[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeIds(ids)));
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [ids, setIdsState] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setIdsState(readStoredIds());
    setReady(true);
  }, []);

  const setIds = useCallback((next: string[]) => {
    const normalized = normalizeIds(next);
    setIdsState(normalized);
    writeStoredIds(normalized);
  }, []);

  const add = useCallback((productId: string): CompareAddResult => {
    let result: CompareAddResult = "added";
    setIdsState((current) => {
      if (current.includes(productId)) {
        result = "exists";
        return current;
      }
      if (current.length >= MAX_COMPARE) {
        result = "limit";
        return current;
      }
      const next = [...current, productId];
      writeStoredIds(next);
      return next;
    });
    return result;
  }, []);

  const remove = useCallback((productId: string) => {
    setIdsState((current) => {
      const next = current.filter((id) => id !== productId);
      writeStoredIds(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setIdsState([]);
    writeStoredIds([]);
  }, []);

  const has = useCallback((productId: string) => ids.includes(productId), [ids]);

  const value = useMemo<CompareContextValue>(
    () => ({
      ids: ready ? ids : [],
      ready,
      has,
      add,
      remove,
      clear,
      setIds,
    }),
    [ready, ids, has, add, remove, clear, setIds]
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}

export function comparePageHref(ids: string[]): string {
  if (ids.length === 0) return "/compare";
  return `/compare?ids=${encodeURIComponent(ids.join(","))}`;
}
