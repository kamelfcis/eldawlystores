"use client";

import { useEffect, useState } from "react";
import { SHOW_DELAY_MS } from "@/lib/loading/operations";

export function useDeferredBusy(active: boolean, delay = SHOW_DELAY_MS) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      return;
    }
    const timer = window.setTimeout(() => setVisible(true), delay);
    return () => window.clearTimeout(timer);
  }, [active, delay]);

  return active && visible;
}
