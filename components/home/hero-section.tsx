import Image from "next/image";
import Link from "next/link";
import { HeroSlider, type HeroSlide } from "@/components/home/hero-slider";
import type { Database } from "@/lib/types/database";

type Banner = Database["public"]["Tables"]["homepage_banners"]["Row"];

const SIDEBAR_CAP = 2;

function bannerHref(banner: Banner) {
  const href = banner.link_url?.trim() ?? "";
  return href.length > 0 ? href : null;
}

function toSlides(heroes: Banner[]): HeroSlide[] {
  const slides: HeroSlide[] = [];
  for (const banner of heroes) {
    const imageUrl = banner.image_url?.trim() ?? "";
    if (!imageUrl) continue;
    slides.push({
      id: banner.id,
      title: banner.title_ar.trim(),
      imageUrl,
      href: bannerHref(banner),
    });
  }
  return slides;
}

function OfferCard({ banner, stretch }: { banner: Banner; stretch?: boolean }) {
  const title = banner.title_ar.trim();
  const subtitle = banner.subtitle_ar?.trim() ?? "";
  const image = banner.image_url?.trim() || null;
  const href = bannerHref(banner);
  const body = (
    <>
      {image ? (
        <div
          className={
            stretch
              ? "relative aspect-[16/10] w-full overflow-hidden lg:aspect-auto lg:min-h-0 lg:flex-1"
              : "relative aspect-[16/10] w-full overflow-hidden"
          }
        >
          <Image
            src={image}
            alt={title || "عرض"}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 360px"
            className="object-cover object-center"
          />
        </div>
      ) : null}
      {title || subtitle ? (
        <div className="min-w-0 space-y-1 px-3 py-2">
          {title ? <h2 className="line-clamp-2 break-words text-[16px] font-bold text-carbon-ink">{title}</h2> : null}
          {subtitle ? <p className="line-clamp-2 break-words text-[14px] leading-relaxed text-graphite">{subtitle}</p> : null}
        </div>
      ) : null}
    </>
  );
  const className = stretch
    ? "flex min-w-0 flex-col overflow-hidden rounded-[8px] border border-retail-line bg-retail-canvas lg:min-h-0 lg:flex-1"
    : "block min-w-0 overflow-hidden rounded-[8px] border border-retail-line bg-retail-canvas";

  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }

  return <article className={className}>{body}</article>;
}

export function HeroSection({ heroes, offers }: { heroes: Banner[]; offers: Banner[] }) {
  const slides = toSlides(heroes);
  const hasSlider = slides.length > 0;
  const hasOffers = offers.length > 0;

  if (!hasSlider && !hasOffers) return null;

  const sidebar = hasSlider ? offers.slice(0, SIDEBAR_CAP) : [];
  const extras = hasSlider ? offers.slice(SIDEBAR_CAP) : offers;
  const mosaic = hasSlider && sidebar.length > 0;

  return (
    <section aria-label={hasSlider ? "الغلاف" : "العروض"} className="min-w-0">
      <div
        className={
          mosaic
            ? "grid min-w-0 items-stretch gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:min-h-[500px]"
            : hasSlider
              ? "min-w-0"
              : "grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-3"
        }
      >
        {hasSlider ? <HeroSlider slides={slides} /> : null}
        {sidebar.length > 0 ? (
          <div className="grid min-w-0 grid-cols-2 gap-3 lg:flex lg:h-full lg:min-h-[500px] lg:flex-col">
            {sidebar.map((banner) => (
              <OfferCard key={banner.id} banner={banner} stretch={mosaic} />
            ))}
          </div>
        ) : null}
        {!hasSlider
          ? extras.map((banner) => <OfferCard key={banner.id} banner={banner} />)
          : null}
      </div>
      {hasSlider && extras.length > 0 ? (
        <div className="mt-3 grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-3">
          {extras.map((banner) => (
            <OfferCard key={banner.id} banner={banner} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
