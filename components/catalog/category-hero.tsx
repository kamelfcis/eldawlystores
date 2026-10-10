import Image from "next/image";

type CategoryHeroProps = {
  title: string;
  total: number;
  description?: string | null;
  imageUrl?: string | null;
};

const titleClass =
  "max-w-[20ch] break-words text-[28px] font-normal leading-[1.10] tracking-[-0.025em] md:text-[36px] lg:text-[48px]";

export function CategoryHero({ title, total, description, imageUrl }: CategoryHeroProps) {
  const image = imageUrl?.trim() || null;
  const line = description?.trim() || null;

  return (
    <section className="relative h-[200px] overflow-hidden rounded-[8px] border border-retail-line lg:h-[300px]">
      {image ? (
        <>
          <Image
            src={image}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 1440px"
            className="hero-image-enter object-cover object-center"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-3/4 bg-[linear-gradient(to_top,rgb(12_12_12/0.72),transparent_64%)]"
          />
          <div className="hero-panel-enter absolute inset-x-0 bottom-0 p-4 sm:p-6">
            <p className="text-[14px] font-bold tracking-[0.038em] text-paper-white tabular-nums">{total} منتج</p>
            <h1 className={`${titleClass} mt-1 text-paper-white`}>{title}</h1>
            {line ? <p className="mt-2 max-w-[40ch] truncate text-[14px] text-paper-white/85">{line}</p> : null}
          </div>
        </>
      ) : (
        <div className="flex h-full flex-col justify-end bg-fog p-4 sm:p-6">
          <p className="text-[14px] font-bold tracking-[0.038em] text-retail-ink tabular-nums">{total} منتج</p>
          <h1 className={`${titleClass} mt-1 text-retail-ink`}>{title}</h1>
          {line ? <p className="mt-2 max-w-[40ch] truncate text-[14px] text-retail-muted">{line}</p> : null}
        </div>
      )}
    </section>
  );
}
