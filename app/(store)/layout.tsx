import { SiteHeader } from "@/components/layout/site-header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFloater } from "@/components/layout/whatsapp-floater";
import { CompareTray } from "@/components/compare/compare-tray";
import { getStoreWhatsapp } from "@/lib/store-settings";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const whatsapp = await getStoreWhatsapp();

  return (
    <div className="flex min-h-full min-w-0 flex-1 flex-col overflow-x-clip bg-retail-canvas text-retail-ink">
      <SiteHeader />
      <main className="mx-auto w-full min-w-0 max-w-[1440px] flex-1 px-4 py-10">{children}</main>
      <Footer />
      <WhatsAppFloater phone={whatsapp} />
      <CompareTray />
    </div>
  );
}
