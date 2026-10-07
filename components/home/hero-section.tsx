import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Database } from "@/lib/types/database";

type Banner = Database["public"]["Tables"]["homepage_banners"]["Row"];

const SIDEBAR_CAP = 3;

function bannerHref(banner: Banner) {
  const href = banner.link_url?.trim() ?? "";
  return href.length > 0 ? href : null;
}

function HeroPanel({ banner }: { banner: Banner }) {
  const title = banner.title_ar.trim();
  const subtitle = banner.subtitle_ar?.trim() ?? "";
  const image = banner.image_url?.trim() || null;
  const href = bannerHref(banner);

  return (
    <div className="flex h-full min-h-[280px] min-w-0 flex-col justify-center gap-4 overflow-hidden rounded-[8px] bg-obsidian p-5 sm:min-h-[320px] sm:p-6 lg:min-h-[500px] lg:flex-row lg:items-stretch lg:gap-8 lg:p-8">
      <div className="flex min-w-0 flex-col justify-center gap-3 lg:flex-1 lg:gap-4">
        {title ? (
          <h1 className="break-words text-[28px] font-bold leading-[1.1] tracking-[-0.025em] text-paper-white sm:text-[40px] lg:text-[48px]">
            {title}
          </h1>
        ) : null}
        {subtitle ? <p className="break-words text-[16px] leading-relaxed text-fog">{subtitle}</p> : null}
        {href ? (
          <Button variant="retail" asChild>
            <Link href={href}>تسوق الآن</Link>
          </Button>
        ) : null}
      </div>
      {image ? (
        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-[8px] lg:aspect-auto lg:max-w-[48%] lg:flex-1 lg:self-stretch">
          <Image
            src={image}
            alt={title || "غلاف"}
            fill
            preload
            sizes="(max-width: 1024px) 100vw, 720px"
            className="object-cover object-center"
          />
        </div>
      ) : null}
    </div>
  );
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
              ? "relative aspect-[16/10] w-full overflow-hidden lg:aspect-auto lg:min-h-0 lg:flex-[7]"
              : "relative aspect-[16/10] w-full overflow-hidden"
          }
        >
          <Image
            src={image}
            alt={title || "عرض"}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
            className="object-cover object-center"
          />
        </div>
      ) : null}
      {title || subtitle ? (
        <div className={stretch ? "min-w-0 space-y-1 px-3 py-2 lg:flex-[3]" : "min-w-0 space-y-1 px-3 py-2"}>
          {title ? <h2 className="break-words text-[16px] font-bold text-carbon-ink">{title}</h2> : null}
          {subtitle ? <p className="break-words text-[14px] leading-relaxed text-graphite">{subtitle}</p> : null}
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
  if (heroes.length === 0 && offers.length === 0) return null;

  const [primary, ...extraHeroes] = heroes;
  const cards = [...extraHeroes, ...offers];
  const sidebar = cards.slice(0, SIDEBAR_CAP);
  const extras = cards.slice(SIDEBAR_CAP);
  const split = Boolean(primary) && sidebar.length > 0;

  return (
    <section aria-label={primary ? "الغلاف" : "العروض"} className="min-w-0">
      <div
        className={
          split
            ? "grid min-w-0 items-stretch gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:grid-rows-1 lg:min-h-[500px]"
            : "min-w-0"
        }
      >
        {primary ? <HeroPanel banner={primary} /> : null}
        {sidebar.length > 0 ? (
          <div
            className={
              split
                ? "flex h-full min-h-0 min-w-0 flex-col gap-4 sm:max-lg:grid sm:max-lg:grid-cols-2 lg:min-h-[500px]"
                : "grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            }
          >
            {sidebar.map((banner) => (
              <OfferCard key={banner.id} banner={banner} stretch={split} />
            ))}
          </div>
        ) : null}
      </div>
      {extras.length > 0 ? (
        <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {extras.map((banner) => (
            <OfferCard key={banner.id} banner={banner} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
