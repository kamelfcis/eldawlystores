import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { getSessionRole, isAdmin } from "@/lib/auth";
import { logout } from "@/lib/auth/actions";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const [admin, session] = await Promise.all([isAdmin(), getSessionRole()]);

  return (
    <>
      <SiteHeader />
      <div className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-10">
        <nav className="mb-6 flex flex-wrap items-center gap-4 border-b border-mist pb-4 text-[14px] font-bold tracking-[0.038em]">
          <Link href="/account" className="text-graphite hover:text-carbon-ink">لوحة التحكم</Link>
          <Link href="/account/orders" className="text-graphite hover:text-carbon-ink">طلباتي</Link>
          <Link href="/account/profile" className="text-graphite hover:text-carbon-ink">الملف الشخصي</Link>
          <Link href="/account/addresses" className="text-graphite hover:text-carbon-ink">العناوين</Link>
          {admin ? (
            <Link href="/admin" className="text-graphite hover:text-carbon-ink">لوحة الإدارة</Link>
          ) : null}
          {session ? (
            <form action={logout} className="ms-auto">
              <Button type="submit" variant="ghost" size="sm">
                تسجيل الخروج
              </Button>
            </form>
          ) : null}
        </nav>
        {children}
      </div>
      <Footer />
    </>
  );
}
