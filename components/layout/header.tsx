"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Search, ShoppingCart, User, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCart } from "@/components/cart/cart-provider";
import { logout } from "@/lib/auth/actions";
import type { AccountMenu } from "@/lib/auth";
import type { Category } from "@/lib/types/database";
import { CategoryMegaMenu } from "@/components/layout/category-mega-menu";

export function Header({
  categories,
  account,
}: {
  categories: Category[];
  account: AccountMenu | null;
}) {
  const { itemCount } = useCart();

  return (
    <header className="border-b border-mist bg-paper-white">
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center gap-6 px-4">
        <Link href="/" className="shrink-0 text-[16px] font-bold tracking-[0.057em] text-carbon-ink">
          Doly Stores
        </Link>

        <CategoryMegaMenu categories={categories} />

        <form action="/products" method="get" className="mx-auto hidden min-w-0 flex-1 sm:block">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-graphite" />
            <Input
              name="search"
              placeholder="ابحث عن منتج"
              className="h-10 border-ash-border bg-fog pr-9 text-[14px] placeholder:text-graphite"
            />
          </div>
        </form>

        <div className="mr-auto flex items-center gap-1 sm:mr-0">
          {account ? <AccountMenuButton account={account} /> : (
            <Link href="/account/login" className="p-2 text-carbon-ink hover:opacity-70" aria-label="حسابي">
              <User className="h-5 w-5" strokeWidth={1.5} />
            </Link>
          )}
          <Link href="/wishlist" className="relative p-2 text-carbon-ink hover:opacity-70" aria-label="المفضلة">
            <Heart className="h-5 w-5" strokeWidth={1.5} />
          </Link>
          <Link href="/cart" className="relative p-2 text-carbon-ink hover:opacity-70" aria-label="السلة">
            <ShoppingCart className="h-5 w-5" strokeWidth={1.5} />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -left-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-carbon-ink px-1 text-[10px] text-paper-white">
                {itemCount}
              </span>
            )}
          </Link>
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
