"use client";

import { usePathname } from "next/navigation";
import { Toaster } from "sonner";

export function AppToaster() {
  const pathname = usePathname();
  const surface = pathname.startsWith("/admin") ? "admin" : "store";

  return (
    <div data-surface={surface}>
      <Toaster
        dir="rtl"
        closeButton
        visibleToasts={3}
        position="top-center"
        offset={{ top: "calc(4rem + 8px)" }}
        containerAriaLabel="إشعارات"
      />
    </div>
  );
}
