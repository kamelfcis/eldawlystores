"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const FALLBACK_SRC = "/branding/doly-wordmark.svg";
const LOGO_CLASS = "h-[32px] w-auto max-w-[145px] shrink-0 object-contain object-right sm:h-[38px] sm:max-w-[180px]";

function isSvgSrc(src: string) {
  try {
    return new URL(src, "https://doly.invalid").pathname.toLowerCase().endsWith(".svg");
  } catch {
    return false;
  }
}

export function StoreLogo({ logoUrl }: { logoUrl: string }) {
  const custom = logoUrl.trim();
  const [stage, setStage] = useState<"custom" | "fallback" | "text">(custom ? "custom" : "fallback");
  const src = stage === "custom" && custom ? custom : FALLBACK_SRC;
  const useImg = stage !== "custom" || isSvgSrc(src);

  if (stage === "text") {
    return (
      <Link href="/" className="shrink-0 text-[16px] font-bold tracking-[0.057em] text-carbon-ink">
        Doly Stores
      </Link>
    );
  }

  function onError() {
    setStage((current) => (current === "custom" ? "fallback" : "text"));
  }

  return (
    <Link href="/" className="flex shrink-0 items-center" aria-label="Doly Stores">
      {useImg ? (
        // SVG (and failed rasters) skip the optimizer so the wordmark stays sharp.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="Doly Stores" className={LOGO_CLASS} onError={onError} />
      ) : (
        <Image src={src} alt="Doly Stores" width={180} height={38} className={LOGO_CLASS} onError={onError} />
      )}
    </Link>
  );
}
