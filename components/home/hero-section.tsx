import Image from "next/image";
import Link from "next/link";
import { HeroSlider, type HeroSlide } from "@/components/home/hero-slider";
import { cn } from "@/lib/utils/cn";
import type { Database } from "@/lib/types/database";

type Banner = Database["public"]["Tables"]["homepage_banners"]["Row"];

function bannerHref(banner: Banner) {
  const href = banner.link_url?.trim() ?? "";
  return href.length > 0 ? href : null;
}

function withImage(rows: Banner[]) {
  return [...rows]
    .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id))
    .filter((banner) => (banner.image_url?.trim() ?? "").length > 0);
}

function toSlides(heroes: Banner[]): HeroSlide[] {
  return heroes.map((banner) => ({
    id: banner.id,
    title: banner.title_ar.trim(),
    imageUrl: (banner.image_url ?? "").trim(),
    href: bannerHref(banner),
  }));
}

function OfferCard({ banner, side, className }: { banner: Banner; side?: boolean; className?: string }) {
  const title = banner.title_ar.trim();
  const image = (banner.image_url ?? "").trim();
  const href = bannerHref(banner);
  const frame = (
    <div className={side ? "relative aspect-[3/4] w-full lg:absolute lg:inset-0 lg:aspect-auto" : "relative aspect-[3/4] w-full"}>
      <Image
        src={image}
        alt={title || "عرض"}
        fill
        sizes={side ? "(max-width: 1024px) 50vw, 23vw" : "(max-width: 1024px) 50vw, 25vw"}
        className="object-cover object-center"
      />
    </div>
  );
  const cardClass = cn(
    "relative block min-w-0 overflow-hidden rounded-[8px] border border-retail-line bg-retail-canvas",
    side && "lg:h-full",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={cardClass}>
        {frame}
      </Link>
    );
  }

  return <article className={cardClass}>{frame}</article>;
}

function OfferRow({ banners, className }: { banners: Banner[]; className?: string }) {
  return (
    <div dir="ltr" className={cn("grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-3", className)}>
      {banners.map((banner) => (
        <OfferCard key={banner.id} banner={banner} />
      ))}
    </div>
  );
}

export function HeroSection({ heroes, offers }: { heroes: Banner[]; offers: Banner[] }) {
  const slides = toSlides(withImage(heroes));
  const imagedOffers = withImage(offers);
  const hasSlider = slides.length > 0;

  if (!hasSlider && imagedOffers.length === 0) return null;

  const left = hasSlider ? imagedOffers[0] : undefined;
  const right = hasSlider ? imagedOffers[1] : undefined;
  const extras = hasSlider ? imagedOffers.slice(2) : imagedOffers;
  const sideCount = (left ? 1 : 0) + (right ? 1 : 0);
  const billboardClass =
    sideCount === 2
      ? "grid grid-cols-2 items-stretch gap-2.5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.35fr)_minmax(0,1fr)] lg:gap-3"
      : "grid grid-cols-2 items-stretch gap-2.5 lg:grid-cols-[minmax(0,1fr)_minmax(0,3.35fr)] lg:gap-3";

  return (
    <section aria-label={hasSlider ? "الغلاف" : "العروض"} className="min-w-0">
      {hasSlider && sideCount > 0 ? (
        <div dir="ltr" className={billboardClass}>
          <div dir="rtl" className="col-span-2 min-w-0 lg:col-span-1 lg:col-start-2 lg:row-start-1">
            <HeroSlider slides={slides} />
          </div>
          {left ? <OfferCard banner={left} side className="lg:col-start-1 lg:row-start-1" /> : null}
          {right ? <OfferCard banner={right} side className="lg:col-start-3 lg:row-start-1" /> : null}
        </div>
      ) : hasSlider ? (
        <HeroSlider slides={slides} />
      ) : (
        <OfferRow banners={extras} />
      )}
      {hasSlider && extras.length > 0 ? <OfferRow banners={extras} className="mt-2.5 lg:mt-3" /> : null}
    </section>
  );
}
