"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { logout } from "@/lib/auth/actions";

type AdminShellProps = {
  name: string;
  children: React.ReactNode;
};

export function AdminShell({ name, children }: AdminShellProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <div data-admin-shell className="min-h-screen overflow-x-hidden bg-fog text-carbon-ink">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col border-l border-mist bg-paper-white md:flex">
          <Link href="/admin" className="px-5 py-5 text-[16px] font-bold tracking-[0.057em] text-carbon-ink">
            Doly
          </Link>
          <AdminNav />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center justify-between gap-3 border-b border-mist bg-paper-white px-4 md:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-[4px] text-carbon-ink hover:bg-fog md:hidden"
                onClick={() => setOpen(true)}
                aria-label="فتح القائمة"
              >
                <Menu className="size-5" aria-hidden="true" />
              </button>
              <p className="truncate text-[14px] text-carbon-ink">{name}</p>
            </div>
            <div className="flex shrink-0 items-center gap-4 text-[14px] font-bold tracking-[0.038em]">
              <Link href="/" className="text-carbon-ink">
                المتجر
              </Link>
              <form action={logout}>
                <button type="submit" className="text-graphite hover:text-carbon-ink">
                  خروج
                </button>
              </form>
            </div>
          </header>
          <div className="min-w-0 flex-1 overflow-x-hidden p-4 md:p-6">{children}</div>
        </div>
      </div>

      {open ? (
        <div className="md:hidden">
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40"
            aria-label="إغلاق القائمة"
            onClick={() => setOpen(false)}
          />
          <aside
            className="fixed inset-y-0 start-0 z-50 flex w-[min(240px,100vw)] flex-col border-l border-mist bg-paper-white"
            role="dialog"
            aria-modal="true"
            aria-label="قائمة الإدارة"
          >
            <div className="flex items-center justify-between gap-2 px-5 py-5">
              <Link href="/admin" className="text-[16px] font-bold tracking-[0.057em] text-carbon-ink">
                Doly
              </Link>
              <button
                type="button"
                className="inline-flex size-9 items-center justify-center rounded-[4px] text-carbon-ink hover:bg-fog"
                onClick={() => setOpen(false)}
                aria-label="إغلاق القائمة"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <AdminNav />
          </aside>
        </div>
      ) : null}
    </div>
  );
}
