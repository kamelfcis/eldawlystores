"use client";

import { useState } from "react";
import Link from "next/link";
import { announcementGradientCss, type StorefrontBranding } from "@/lib/store-branding";

export interface AnnouncementMessage {
  title: string;
  href: string | null;
  imageUrl?: string | null;
}

const FALLBACK = "شحن مجاني للطلبات فوق 5,000 ج.م — دفع عند الاستلام";

function widen(items: AnnouncementMessage[]) {
  if (items.length === 0) return items;
  const widened = [...items];
  while (widened.length < 8) widened.push(...items);
  return widened;
}

function AnnouncementChip({ src }: { src: string }) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <span className="inline-flex shrink-0 items-center rounded-[4px] bg-paper-white p-0.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="block h-9 w-auto max-w-[72px] object-contain"
        onError={() => setHidden(true)}
      />
    </span>
  );
}

function AdsSequence({
  items,
  clone = false,
}: {
  items: AnnouncementMessage[];
  clone?: boolean;
}) {
  return (
    <div className="flex h-12 max-h-12 shrink-0 items-center" data-ads-clone={clone ? "" : undefined} aria-hidden={clone || undefined}>
      {items.map((item, index) => {
        const className = "inline-flex h-12 max-h-12 items-center gap-2 whitespace-nowrap px-8 text-[14px] font-bold tracking-[0.038em] text-paper-white";
        const image = item.imageUrl?.trim() ?? "";
        const body = (
          <>
            {image ? <AnnouncementChip src={image} /> : null}
            {item.title}
          </>
        );
        return (
          <span key={`${item.title}-${index}`} className="inline-flex h-12 max-h-12 items-center">
            {item.href ? (
              <Link href={item.href} tabIndex={clone ? -1 : undefined} className={className}>
                {body}
              </Link>
            ) : (
              <span className={className}>{body}</span>
            )}
            <span aria-hidden className="h-3 w-px shrink-0 bg-paper-white" />
          </span>
        );
      })}
    </div>
  );
}

export function AnnouncementBar({
  messages,
  branding,
}: {
  messages: AnnouncementMessage[];
  branding: StorefrontBranding;
}) {
  const items = widen(messages.filter((message) => message.title.trim().length > 0));
  const paint = { backgroundImage: announcementGradientCss(branding) };
  const staticBar = !branding.marqueeEnabled;

  if (items.length === 0) {
    return (
      <div
        className="ads-bar relative flex h-12 max-h-12 items-center justify-center overflow-hidden px-4 text-center text-[14px] font-bold tracking-[0.038em] text-paper-white"
        style={paint}
      >
        <p className="relative z-[1]">{FALLBACK}</p>
        <span className="ads-bar-sheen" aria-hidden />
      </div>
    );
  }

  return (
    <div
      className={staticBar ? "ads-bar ads-bar--static h-12 max-h-12 overflow-hidden text-paper-white" : "ads-bar h-12 max-h-12 overflow-hidden text-paper-white"}
      dir="rtl"
      role="region"
      aria-label="إعلانات"
      style={paint}
    >
      <div className="ads-track relative z-[1] h-12 max-h-12 items-center">
        <AdsSequence items={items} />
        <AdsSequence items={items} clone />
      </div>
      <span className="ads-bar-sheen" aria-hidden />
    </div>
  );
}
