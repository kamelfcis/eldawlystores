import { getBanners, getCategories, getCategoryBrandMap } from "@/lib/catalog";
import { getAccountMenu } from "@/lib/auth";
import { getStorefrontBranding } from "@/lib/store-settings";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { CategoryStrip } from "@/components/layout/category-strip";
import { Header } from "@/components/layout/header";

export async function SiteHeader() {
  const [banners, categories, brandsByCategory, account, branding] = await Promise.all([
    getBanners(),
    getCategories(),
    getCategoryBrandMap(),
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
      <Header categories={categories} brandsByCategory={brandsByCategory} account={account} logoUrl={branding.logoUrl} />
      <CategoryStrip categories={categories} />
    </div>
  );
}
