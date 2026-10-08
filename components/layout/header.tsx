"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { User, Heart } from "lucide-react";
import { logout } from "@/lib/auth/actions";
import type { AccountMenu } from "@/lib/auth";
import type { Category } from "@/lib/types/database";
import { CategoryMegaMenu } from "@/components/layout/category-mega-menu";
import { StoreLogo } from "@/components/layout/store-logo";
import { CartDrawerTrigger } from "@/components/cart/cart-drawer";
import { DesktopSearchForm, MobileSearchDialog } from "@/components/layout/mobile-search-dialog";

export function Header({
  categories,
  account,
  logoUrl,
}: {
  categories: Category[];
  account: AccountMenu | null;
  logoUrl: string;
}) {
  return (
    <header className="border-b border-mist bg-paper-white">
      <div className="relative mx-auto flex h-16 w-full max-w-[1440px] items-center gap-3 px-4 sm:gap-6">
        <div className="relative z-10 shrink-0 lg:hidden">
          <CartDrawerTrigger />
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 z-0 flex h-16 items-center justify-center lg:hidden">
          <div className="pointer-events-auto max-w-[min(180px,42vw)]">
            <StoreLogo logoUrl={logoUrl} align="center" />
          </div>
        </div>

        <div className="hidden shrink-0 lg:block">
          <StoreLogo logoUrl={logoUrl} />
        </div>

        <div className="hidden lg:block">
          <CategoryMegaMenu categories={categories} placement="desktop" />
        </div>

        <div className="hidden min-w-0 flex-1 lg:block">
          <DesktopSearchForm />
        </div>

        <div className="relative z-10 ms-auto flex items-center gap-0.5 lg:ms-0">
          <MobileSearchDialog />
          <div className="lg:hidden">
            <CategoryMegaMenu categories={categories} placement="mobile" />
          </div>
          <div className="hidden items-center gap-1 lg:flex">
            {account ? <AccountMenuButton account={account} /> : (
              <Link href="/account/login" className="p-2 text-carbon-ink hover:opacity-70" aria-label="حسابي">
                <User className="h-5 w-5" strokeWidth={1.5} />
              </Link>
            )}
            <Link href="/wishlist" className="relative p-2 text-carbon-ink hover:opacity-70" aria-label="المفضلة">
              <Heart className="h-5 w-5" strokeWidth={1.5} />
            </Link>
            <CartDrawerTrigger />
          </div>
        </div>
      </div>
    </header>
  );
}

function AccountMenuButton({ account }: { account: AccountMenu }) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const pinned = useRef(false);
  const pointerDown = useRef(false);
  const openedByHoverAt = useRef(0);
  const [open, setOpen] = useState(false);
  const [hoverCapable, setHoverCapable] = useState(false);
  const title = account.name?.trim() || account.email;
  const showEmail = Boolean(account.name?.trim());

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => setHoverCapable(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        pinned.current = false;
        setOpen(false);
      }
    }
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        pinned.current = false;
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, []);

  function closeMenu() {
    pinned.current = false;
    setOpen(false);
  }

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={() => {
        if (!hoverCapable) return;
        openedByHoverAt.current = Date.now();
        setOpen(true);
      }}
      onMouseLeave={() => {
        if (hoverCapable && !pinned.current) setOpen(false);
      }}
      onPointerDown={() => {
        pointerDown.current = true;
      }}
      onPointerUp={() => {
        pointerDown.current = false;
      }}
      onFocus={() => {
        if (!pointerDown.current) setOpen(true);
      }}
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node)) closeMenu();
      }}
    >
      <button
        type="button"
        className="rounded-[4px] p-2 text-carbon-ink hover:opacity-70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-carbon-ink"
        aria-label="حسابي"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => {
          const justOpenedByHover = Date.now() - openedByHoverAt.current < 500;
          setOpen((current) => {
            if (justOpenedByHover && current) {
              pinned.current = true;
              return true;
            }
            const next = !current;
            pinned.current = next;
            return next;
          });
        }}
      >
        <User className="h-5 w-5" strokeWidth={1.5} />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="الحساب"
          className="absolute end-0 top-full z-50 mt-1 w-56 rounded-[8px] border border-mist bg-paper-white p-2"
        >
          <div className="border-b border-mist px-2 py-2">
            <p className="text-[14px] font-bold text-carbon-ink">{title}</p>
            {showEmail ? <p className="mt-1 text-[14px] text-graphite">{account.email}</p> : null}
          </div>
          <div className="mt-1 flex flex-col">
            <Link
              href="/account"
              role="menuitem"
              className="rounded-[4px] px-2 py-2 text-[14px] font-bold tracking-[0.038em] text-carbon-ink hover:bg-fog"
              onClick={closeMenu}
            >
              حسابي
            </Link>
            <Link
              href="/account/profile"
              role="menuitem"
              className="rounded-[4px] px-2 py-2 text-[14px] font-bold tracking-[0.038em] text-carbon-ink hover:bg-fog"
              onClick={closeMenu}
            >
              الإعدادات
            </Link>
            {account.isAdmin ? (
              <Link
                href="/admin"
                role="menuitem"
                className="rounded-[4px] px-2 py-2 text-[14px] font-bold tracking-[0.038em] text-carbon-ink hover:bg-fog"
                onClick={closeMenu}
              >
                لوحة الإدارة
              </Link>
            ) : null}
            <form action={logout}>
              <button
                type="submit"
                role="menuitem"
                className="w-full rounded-[4px] px-2 py-2 text-start text-[14px] font-bold tracking-[0.038em] text-carbon-ink hover:bg-fog"
              >
                تسجيل الخروج
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
