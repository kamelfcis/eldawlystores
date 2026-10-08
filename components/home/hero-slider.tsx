"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export type HeroSlide = {
  id: string;
  title: string;
  imageUrl: string;
  href: string | null;
};

const AUTOPLAY_MS = 6000;
const SWIPE_PX = 40;
const controlClass =
  "absolute top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-[4px] bg-obsidian/55 text-paper-white select-none hover:bg-obsidian/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-paper-white";

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<{
    id: number;
    x: number;
    y: number;
    locked: boolean | null;
  } | null>(null);

  const go = useCallback(
    (next: number) => {
      if (count < 1) return;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  const step = useCallback(
    (delta: 1 | -1) => {
      go(index + delta);
    },
    [go, index],
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (count < 2 || paused || reduceMotion) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [count, paused, reduceMotion, index]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (count < 2) return;
      const root = viewportRef.current;
      if (!root?.contains(document.activeElement) && document.activeElement !== root) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setIndex((current) => (current + 1) % count);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setIndex((current) => (current - 1 + count) % count);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [count]);

  if (count === 0) return null;

  const width = viewportRef.current?.clientWidth ?? 1;
  const dragPercent = dragging && width > 0 ? (dragX / width) * 100 : 0;
  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (count < 2 || event.button !== 0) return;
    pointerRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, locked: null };
    setDragging(false);
    setDragX(0);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const start = pointerRef.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (start.locked === null) {
      if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return;
      start.locked = Math.abs(dx) > Math.abs(dy);
      if (!start.locked) return;
      setDragging(true);
    }
    if (!start.locked) return;
    setDragX(dx);
  }

  function endPointer(event: ReactPointerEvent<HTMLDivElement>) {
    const start = pointerRef.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    pointerRef.current = null;
    setDragging(false);
    setDragX(0);
    if (!start.locked) return;
    if (Math.abs(dx) >= SWIPE_PX && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) step(1);
      else step(-1);
    }
  }

  return (
    <div
      ref={viewportRef}
      className="hero-slider relative h-full min-h-0 min-w-0 overflow-hidden rounded-[8px] border border-retail-line bg-obsidian focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-retail-ink"
      role="region"
      aria-roledescription="carousel"
      aria-label="الغلاف"
      tabIndex={0}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setPaused(false);
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
    >
      <div className="relative aspect-[16/10] w-full lg:aspect-[16/9]">
        {slides.map((slide, slideIndex) => {
          const offset = (slideIndex - index) * -100 + dragPercent;
          const title = slide.title;
          const href = slide.href;
          const animate = !dragging && !reduceMotion;
          const Heading = slideIndex === index && title ? "h1" : "h2";
          const media = (
            <Image
              src={slide.imageUrl}
              alt={title || "غلاف"}
              fill
              preload={slideIndex === 0}
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover object-center"
            />
          );
          const overlay =
            title || href ? (
              <div
                className={`hero-panel-enter pointer-events-none absolute inset-x-0 bottom-0 bg-[linear-gradient(to_top,rgb(12_12_12/0.72),transparent_64%)] p-4 sm:p-6 ${count > 1 ? "pb-12" : ""}`}
              >
                {title ? (
                  <Heading className="max-w-[20ch] break-words text-[22px] font-bold leading-[1.1] tracking-[-0.025em] text-paper-white sm:text-[28px] lg:text-[32px]">
                    {title}
                  </Heading>
                ) : null}
                {href ? (
                  <Button variant="retail" size="sm" className="pointer-events-auto mt-3" asChild>
                    <Link href={href} tabIndex={slideIndex === index ? 0 : -1}>
                      تسوق الآن
                    </Link>
                  </Button>
                ) : null}
              </div>
            ) : null;

          return (
            <div
              key={slide.id}
              className="absolute inset-0"
              aria-hidden={slideIndex === index ? undefined : true}
              style={{
                transform: `translate3d(${offset}%, 0, 0)`,
                transition: animate ? "transform var(--motion-large) var(--motion-ease)" : "none",
              }}
            >
              {href && !title ? (
                <Link href={href} className="absolute inset-0" tabIndex={slideIndex === index ? 0 : -1} aria-label="تسوق الآن">
                  {media}
                </Link>
              ) : (
                media
              )}
              {overlay}
            </div>
          );
        })}
      </div>

      {count > 1 ? (
        <>
          <button type="button" className={`${controlClass} end-2`} aria-label="التالي" onClick={() => step(1)}>
            <ChevronLeft className="size-5 shrink-0" strokeWidth={2} />
          </button>
          <button type="button" className={`${controlClass} start-2`} aria-label="السابق" onClick={() => step(-1)}>
            <ChevronRight className="size-5 shrink-0" strokeWidth={2} />
          </button>
          <div className="absolute inset-x-0 bottom-1 z-10 flex justify-center gap-0.5">
            {slides.map((slide, slideIndex) => {
              const current = slideIndex === index;
              return (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`الشريحة ${slideIndex + 1}`}
                  aria-current={current ? "true" : undefined}
                  className="flex size-11 items-center justify-center select-none"
                  onClick={() => go(slideIndex)}
                >
                  <span
                    className={
                      current ? "block h-2 w-2 rounded-full bg-paper-white" : "block h-2 w-2 rounded-full bg-paper-white/45"
                    }
                  />
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
