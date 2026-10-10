"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

type NavLink = { href: string; label: string; exact?: boolean };

const NAV_LINKS: NavLink[] = [
  { href: "/account", label: "لوحة التحكم", exact: true },
  { href: "/account/orders", label: "طلباتي" },
  { href: "/account/profile", label: "الملف الشخصي" },
  { href: "/account/addresses", label: "العناوين" },
];

function isNavActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AccountNav({ admin }: { admin: boolean }) {
  const pathname = usePathname();

  return (
    <>
      {NAV_LINKS.map(({ href, label, exact }) => {
        const active = isNavActive(pathname, href, exact);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-[4px] px-1 py-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-carbon-ink",
              active
                ? "text-retail-ink underline decoration-retail-ink underline-offset-4"
                : "text-graphite hover:text-carbon-ink"
            )}
          >
            {label}
          </Link>
        );
      })}
      {admin ? (
        <Link
          href="/admin"
          className="rounded-[4px] px-1 py-0.5 text-graphite hover:text-carbon-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-carbon-ink"
        >
          لوحة الإدارة
        </Link>
      ) : null}
    </>
  );
}
