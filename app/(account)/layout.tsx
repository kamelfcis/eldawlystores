import { SiteHeader } from "@/components/layout/site-header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { AccountNav } from "@/components/account/account-nav";
import { getSessionRole, isAdmin } from "@/lib/auth";
import { logout } from "@/lib/auth/actions";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const [admin, session] = await Promise.all([isAdmin(), getSessionRole()]);

  return (
    <>
      <SiteHeader />
      <div className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-10">
        <nav
          aria-label="حسابي"
          className="mb-6 flex flex-wrap items-center gap-4 border-b border-mist pb-4 text-[14px] font-bold tracking-[0.038em]"
        >
          <AccountNav admin={admin} />
          {session ? (
            <form action={logout} className="ms-auto">
              <Button type="submit" variant="ghost" size="sm" className="h-10 min-h-10">
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
