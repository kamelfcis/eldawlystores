"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Menu, X } from "lucide-react";
import { logout } from "@/lib/auth/actions";
import type { AccountMenu } from "@/lib/auth";
import type { Brand, Category } from "@/lib/types/database";
import { guestAccountLinks, signedInAccountLinks } from "@/components/account/storefront-account-links";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const DEST_CLASS =
  "flex h-12 w-full items-center px-4 text-[16px] font-bold tracking-[0.038em] text-carbon-ink hover:bg-fog focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-carbon-ink";

export function MobileStoreDrawer({
  account,
  categories,
  brandsByCategory,
}: {
  account: AccountMenu | null;
  categories: Category[];
  brandsByCategory: Record<string, Brand[]>;
}) {
  const [open, setOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  function close() {
    setOpen(false);
    setActiveCategoryId(null);
  }

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="inline-flex size-11 items-center justify-center text-carbon-ink hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-carbon-ink"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={open ? "إغلاق القائمة" : "القائمة"}
        onClick={() => {
          if (open) close();
          else setOpen(true);
        }}
      >
        {open ? <X className="size-5 shrink-0" strokeWidth={1.5} /> : <Menu className="size-5 shrink-0" strokeWidth={1.5} />}
      </button>
      <StoreDrawerSheet
        open={open}
        account={account}
        categories={categories}
        brandsByCategory={brandsByCategory}
        activeCategoryId={activeCategoryId}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setActiveCategoryId(null);
        }}
        onSelectCategory={setActiveCategoryId}
        onBack={() => setActiveCategoryId(null)}
        onNavigate={close}
      />
    </div>
  );
}

function StoreDrawerSheet({
  open,
  account,
  categories,
  brandsByCategory,
  activeCategoryId,
  onOpenChange,
  onSelectCategory,
  onBack,
  onNavigate,
}: {
  open: boolean;
  account: AccountMenu | null;
  categories: Category[];
  brandsByCategory: Record<string, Brand[]>;
  activeCategoryId: string | null;
  onOpenChange: (open: boolean) => void;
  onSelectCategory: (id: string) => void;
  onBack: () => void;
  onNavigate: () => void;
}) {
  const active = categories.find((category) => category.id === activeCategoryId) ?? null;
  const brands = active ? brandsByCategory[active.id] ?? [] : [];
  const title = account?.name?.trim() || account?.email || "";
  const initial = title.slice(0, 1);
  const showEmail = Boolean(account?.name?.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        aria-label="القائمة"
        aria-describedby={undefined}
        className="store-drawer-sheet inset-y-0 start-0 end-auto top-0 left-auto h-dvh max-h-none w-[min(360px,88vw)] max-w-none translate-x-0 translate-y-0 overflow-hidden rounded-none border-0 border-e border-mist bg-paper-white p-0"
      >
        <div className="flex h-full min-h-0 flex-col">
          <DialogHeader className="sticky top-0 z-10 flex-row items-center gap-1 border-b border-mist bg-paper-white px-2 py-0">
            <DialogClose className="inline-flex size-11 shrink-0 items-center justify-center text-carbon-ink hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-carbon-ink">
              <X className="size-5 shrink-0" strokeWidth={1.5} />
              <span className="sr-only">إغلاق</span>
            </DialogClose>
            <DialogTitle className="min-w-0 flex-1 truncate text-[16px] font-bold tracking-[0.057em] text-carbon-ink">
              {active ? active.name_ar : "القائمة"}
            </DialogTitle>
            <ThemeToggle />
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {active ? (
              <div className="px-2 py-2">
                <button
                  type="button"
                  onClick={onBack}
                  className="flex h-11 w-full items-center gap-2 px-2 text-[14px] font-bold tracking-[0.038em] text-carbon-ink"
                >
                  رجوع
                </button>
                <Link href={`/categories/${active.slug}`} onClick={onNavigate} className={DEST_CLASS}>
                  كل منتجات القسم
                </Link>
                {brands.map((brand) => (
                  <Link
                    key={brand.id}
                    href={`/categories/${active.slug}?brand=${brand.slug}`}
                    onClick={onNavigate}
                    className="flex h-12 items-center gap-3 px-4 text-[16px] text-retail-ink hover:bg-fog"
                  >
                    {brand.logo_url ? (
                      <Image src={brand.logo_url} alt="" width={28} height={28} className="size-7 shrink-0 rounded-full object-contain" />
                    ) : null}
                    {brand.name}
                  </Link>
                ))}
              </div>
            ) : (
              <>
                <AccountBlock account={account} initial={initial} showEmail={showEmail} title={title} onNavigate={onNavigate} />
                <div className="border-t border-mist px-2 py-2">
                  {categories.map((category) => {
                    const image = category.image_url?.trim() || null;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => onSelectCategory(category.id)}
                        className="flex h-14 w-full items-center gap-3 px-2 text-start"
                      >
                        <span className="relative size-10 shrink-0 overflow-hidden rounded-full bg-fog">
                          {image ? <Image src={image} alt="" fill sizes="40px" className="object-cover" /> : null}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[16px] text-retail-ink">{category.name_ar}</span>
                        <ChevronLeft className="size-4 shrink-0 text-graphite" aria-hidden />
                      </button>
                    );
                  })}
                  <Link href="/categories" onClick={onNavigate} className={`${DEST_CLASS} mt-2`}>
                    كل الأقسام
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AccountBlock({
  account,
  initial,
  showEmail,
  title,
  onNavigate,
}: {
  account: AccountMenu | null;
  initial: string;
  showEmail: boolean;
  title: string;
  onNavigate: () => void;
}) {
  const links = account ? signedInAccountLinks(account.isAdmin) : guestAccountLinks();

  return (
    <div className="px-2 py-3">
      {account ? (
        <div className="mb-2 flex items-start gap-3 px-2">
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-fog text-[16px] font-bold text-carbon-ink"
          >
            {initial}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-bold text-carbon-ink">{title}</p>
            {showEmail ? <p className="mt-1 truncate text-[14px] text-graphite">{account.email}</p> : null}
          </div>
        </div>
      ) : null}
      <nav aria-label="الحساب">
        <ul role="list" className="flex flex-col">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} onClick={onNavigate} className={DEST_CLASS}>
                {link.label}
              </Link>
            </li>
          ))}
          {account ? (
            <li>
              <form action={logout}>
                <button type="submit" className={`${DEST_CLASS} text-start`}>
                  تسجيل الخروج
                </button>
              </form>
            </li>
          ) : null}
        </ul>
      </nav>
    </div>
  );
}
