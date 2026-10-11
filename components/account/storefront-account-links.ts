export type StorefrontAccountLink = { href: string; label: string };

export function guestAccountLinks(): StorefrontAccountLink[] {
  return [
    { href: "/account/login", label: "تسجيل الدخول" },
    { href: "/account/signup", label: "إنشاء حساب" },
    { href: "/wishlist", label: "المفضلة" },
  ];
}

export function signedInAccountLinks(isAdmin: boolean): StorefrontAccountLink[] {
  const links: StorefrontAccountLink[] = [
    { href: "/account", label: "حسابي" },
    { href: "/account/orders", label: "طلباتي" },
    { href: "/account/profile", label: "الملف" },
    { href: "/account/addresses", label: "العناوين" },
    { href: "/wishlist", label: "المفضلة" },
  ];
  if (isAdmin) links.push({ href: "/admin", label: "لوحة الإدارة" });
  return links;
}
