"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export interface ProductGalleryImage {
  id: string;
  url: string;
  alt_text: string | null;
}

const thumbFrame = { width: 64, height: 64 };

function imageAlt(altText: string | null, productName: string): string {
  const alt = altText?.trim();
  return alt ? alt : productName;
}

export function ProductGallery({
  images,
  productName,
}: {
  images: ProductGalleryImage[];
  productName: string;
}) {
  const photos = images.filter((image) => image.url.trim().length > 0);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const index = active >= 0 && active < photos.length ? active : 0;
  const current = photos[index] ?? null;
  const src = current?.url ?? "/placeholder-product.svg";
  const alt = current ? imageAlt(current.alt_text, productName) : productName;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (photos.length < 2) return;
      if (!rootRef.current?.contains(document.activeElement)) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setActive((currentIndex) => (currentIndex - 1 + photos.length) % photos.length);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        setActive((currentIndex) => (currentIndex + 1) % photos.length);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [photos.length]);

  return (
    <div ref={rootRef} className="min-w-0">
      <div className="relative aspect-square overflow-hidden rounded-[8px] bg-fog">
        <Image
          src={src}
          alt={alt}
          fill
          preload={index === 0}
          sizes="(max-width: 768px) 100vw, 640px"
          className="object-contain p-6"
        />
      </div>
      {photos.length > 1 ? (
        <ul className="mt-3 flex gap-2 overflow-x-auto p-1.5 scrollbar-hide">
          {photos.map((image, photoIndex) => {
            const selected = photoIndex === index;
            return (
              <li key={image.id} className="shrink-0">
                <button
                  type="button"
                  aria-label={imageAlt(image.alt_text, productName)}
                  aria-current={selected ? "true" : undefined}
                  onClick={() => setActive(photoIndex)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    setActive(photoIndex);
                  }}
                  data-gallery-thumb=""
                  style={thumbFrame}
                  className={`gallery-thumb relative h-16 w-16 shrink-0 overflow-hidden rounded-[8px] bg-fog ${
                    selected ? "ring-2 ring-retail-ink" : "ring-1 ring-retail-line"
                  }`}
                >
                  <Image
                    src={image.url}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-contain p-1"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
