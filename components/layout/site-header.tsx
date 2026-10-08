import { getBanners, getCategories } from "@/lib/catalog";
import { getAccountMenu } from "@/lib/auth";
import { getStorefrontBranding } from "@/lib/store-settings";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";

export async function SiteHeader() {
  const [banners, categories, account, branding] = await Promise.all([
    getBanners(),
    getCategories(),
    getAccountMenu(),
    getStorefrontBranding(),
  ]);

  return (
    <div className="sticky top-0 z-40">
      <AnnouncementBar
        branding={branding}
        messages={banners
          .filter((banner) => banner.type === "announcement")
          .map((banner) => ({
            title: banner.title_ar,
            href: banner.link_url,
            imageUrl: banner.image_url,
          }))}
      />
      <Header categories={categories} account={account} logoUrl={branding.logoUrl} />
    </div>
  );
}
