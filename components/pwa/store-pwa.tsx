"use client";

import { useEffect, useState } from "react";

type NetState = "offline" | "weak" | "restored" | null;

type NetworkInformationLike = {
  saveData?: boolean;
  effectiveType?: string;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
};

function networkInfo(): NetworkInformationLike | undefined {
  const nav = navigator as Navigator & {
    connection?: NetworkInformationLike;
    mozConnection?: NetworkInformationLike;
    webkitConnection?: NetworkInformationLike;
  };
  return nav.connection ?? nav.mozConnection ?? nav.webkitConnection;
}

function connectionWeak() {
  const connection = networkInfo();
  if (!connection) return false;
  return connection.saveData === true || connection.effectiveType === "2g" || connection.effectiveType === "slow-2g";
}

export function StorePwa() {
  const [updateReady, setUpdateReady] = useState<ServiceWorker | null>(null);
  const [net, setNet] = useState<NetState>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let registration: ServiceWorkerRegistration | undefined;
    const onControllerChange = () => {
      if (sessionStorage.getItem("doly-sw-reload") === "1") {
        sessionStorage.removeItem("doly-sw-reload");
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    navigator.serviceWorker.register("/sw.js", { scope: "/" }).then((reg) => {
      registration = reg;
      if (reg.waiting) setUpdateReady(reg.waiting);
      reg.addEventListener("updatefound", () => {
        const worker = reg.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            setUpdateReady(reg.waiting ?? worker);
          }
        });
      });
    });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      void registration;
    };
  }, []);

  useEffect(() => {
    function applyOnline() {
      setNet((current) => {
        if (current === "offline") return "restored";
        return connectionWeak() ? "weak" : null;
      });
    }
    function applyOffline() {
      setNet("offline");
    }

    const initial = window.setTimeout(() => {
      if (!navigator.onLine) applyOffline();
      else if (connectionWeak()) setNet("weak");
    }, 0);

    window.addEventListener("online", applyOnline);
    window.addEventListener("offline", applyOffline);
    const connection = networkInfo();
    connection?.addEventListener?.("change", applyOnline);

    return () => {
      window.clearTimeout(initial);
      window.removeEventListener("online", applyOnline);
      window.removeEventListener("offline", applyOffline);
      connection?.removeEventListener?.("change", applyOnline);
    };
  }, []);

  useEffect(() => {
    if (net !== "restored") return;
    const timer = window.setTimeout(() => setNet(connectionWeak() ? "weak" : null), 3200);
    return () => window.clearTimeout(timer);
  }, [net]);

  function applyUpdate() {
    if (!updateReady) return;
    sessionStorage.setItem("doly-sw-reload", "1");
    updateReady.postMessage({ type: "SKIP_WAITING" });
  }

  const netLabel =
    net === "offline" ? "أنت تعمل بدون اتصال مؤقتاً" : net === "weak" ? "الاتصال ضعيف" : net === "restored" ? "تم استعادة الاتصال" : null;

  return (
    <>
      {updateReady ? (
        <div className="fixed end-4 bottom-20 z-50 flex items-center gap-3 rounded-[8px] border border-retail-line bg-paper-white px-3 py-2 text-[14px] text-retail-ink">
          <span>يتوفر تحديث جديد</span>
          <button
            type="button"
            className="rounded-[4px] bg-carbon-ink px-3 py-1 text-[14px] font-bold tracking-[0.038em] text-paper-white"
            onClick={applyUpdate}
          >
            تحديث
          </button>
        </div>
      ) : null}
      {netLabel ? (
        <div
          role="status"
          className="pointer-events-none fixed end-4 bottom-4 z-50 rounded-[8px] border border-retail-line bg-paper-white px-3 py-2 text-[14px] text-retail-ink"
        >
          {netLabel}
        </div>
      ) : null}
    </>
  );
}
