import Image from "next/image";
import Link from "next/link";

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

function AdsSequence({
  items,
  clone = false,
}: {
  items: AnnouncementMessage[];
  clone?: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center" data-ads-clone={clone ? "" : undefined} aria-hidden={clone || undefined}>
      {items.map((item, index) => {
        const className = "inline-flex items-center gap-2 whitespace-nowrap px-8 text-[14px] font-bold tracking-[0.038em] text-paper-white";
        const body = (
          <>
            {item.imageUrl ? (
              <Image src={item.imageUrl} alt="" width={28} height={28} className="h-7 w-7 rounded-[4px] object-cover" />
            ) : null}
            {item.title}
          </>
        );
        return (
          <span key={`${item.title}-${index}`} className="inline-flex items-center">
            {item.href ? (
              <Link href={item.href} tabIndex={clone ? -1 : undefined} className={className}>
                {body}
              </Link>
            ) : (
              <span className={className}>{body}</span>
            )}
          </span>
        );
      })}
    </div>
  );
}

export function AnnouncementBar({ messages }: { messages: AnnouncementMessage[] }) {
  const items = widen(messages.filter((message) => message.title.trim().length > 0));

  if (items.length === 0) {
    return (
      <div className="flex h-8 items-center justify-center bg-carbon-ink px-4 text-center text-[14px] font-bold tracking-[0.038em] text-paper-white">
        <p>{FALLBACK}</p>
      </div>
    );
  }

  return (
    <div className="ads-bar h-8 overflow-hidden bg-carbon-ink text-paper-white" dir="rtl" role="region" aria-label="إعلانات">
      <div className="ads-track h-full items-center">
        <AdsSequence items={items} />
        <AdsSequence items={items} clone />
      </div>
    </div>
  );
}
