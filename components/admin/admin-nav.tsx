"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgePercent,
  House,
  Layers,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingBag,
  Tag,
  type LucideIcon,
} from "lucide-react";

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/admin/orders", label: "الطلبات", icon: ShoppingBag },
  { href: "/admin/products", label: "المنتجات", icon: Package },
  { href: "/admin/categories", label: "الفئات", icon: Layers },
  { href: "/admin/brands", label: "العلامات", icon: Tag },
  { href: "/admin/promotions", label: "العروض", icon: BadgePercent },
  { href: "/admin/homepage", label: "الصفحة الرئيسية", icon: House },
  { href: "/admin/settings", label: "الإعدادات", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = item.href === "/admin" ? pathname === "/admin" : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 rounded-[4px] px-3 py-2 text-[14px] font-bold tracking-[0.038em] ${
              active ? "bg-fog text-carbon-ink" : "text-graphite hover:bg-fog hover:text-carbon-ink"
            }`}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
