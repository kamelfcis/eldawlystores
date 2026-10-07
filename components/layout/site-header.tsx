import { getBanners, getCategories } from "@/lib/catalog";
import { getAccountMenu } from "@/lib/auth";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";

export async function SiteHeader() {
  const [banners, categories, account] = await Promise.all([
    getBanners(),
    getCategories(),
    getAccountMenu(),
  ]);

  return (
    <div className="sticky top-0 z-40">
      <AnnouncementBar
        messages={banners
          .filter((banner) => banner.type === "announcement")
          .map((banner) => ({
            title: banner.title_ar,
            href: banner.link_url,
            imageUrl: banner.image_url,
          }))}
      />
      <Header categories={categories} account={account} />
    </div>
  );
}
