"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { notify } from "@/lib/feedback/notify";

const NOTICES: Record<string, string> = {
  "product-deleted": "تم حذف المنتج",
};

export function QueryNoticeToast() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const key = searchParams.get("notice");
    if (!key) return;
    const message = NOTICES[key];
    if (message) notify.success(message);
    const next = new URLSearchParams(searchParams.toString());
    next.delete("notice");
    const query = next.toString();
    router.replace(query ? `${window.location.pathname}?${query}` : window.location.pathname, { scroll: false });
  }, [router, searchParams]);

  return null;
}
