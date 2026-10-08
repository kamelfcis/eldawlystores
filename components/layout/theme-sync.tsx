"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { applyStoreTheme, readStoreTheme } from "@/components/layout/theme-toggle";

export function ThemeSync() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin")) {
      document.documentElement.classList.remove("dark");
      return;
    }
    applyStoreTheme(readStoreTheme());
  }, [pathname]);

  return null;
}
