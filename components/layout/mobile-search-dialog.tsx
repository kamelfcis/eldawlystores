"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function MobileSearchDialog() {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(timer);
    }
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="p-2 text-carbon-ink hover:opacity-70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-carbon-ink sm:hidden"
        aria-label="بحث"
        onClick={() => setOpen(true)}
      >
        <Search className="h-5 w-5" strokeWidth={1.5} />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="fixed inset-x-0 top-0 max-w-none translate-x-0 translate-y-0 rounded-none border-0 border-b border-mist p-4 sm:hidden"
          aria-describedby={undefined}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>بحث المنتجات</DialogTitle>
          </DialogHeader>
          <form action="/products" method="get" className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-graphite" />
              <Input
                ref={inputRef}
                name="search"
                placeholder="ابحث عن منتج"
                className="h-10 border-ash-border bg-fog pr-9 text-[14px] placeholder:text-graphite focus-visible:ring-retail-ink"
              />
            </div>
            <button
              type="submit"
              className="h-10 shrink-0 rounded-[4px] bg-carbon-ink px-4 text-[14px] font-bold text-paper-white"
            >
              بحث
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function readSearchFromLocation() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("search") ?? "";
}

export function DesktopSearchForm() {
  const [value, setValue] = useState(readSearchFromLocation);

  return (
    <form action="/products" method="get" className="mx-auto min-w-0 flex-1">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-graphite" />
        <Input
          name="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="ابحث عن منتج"
          className="h-10 border-ash-border bg-fog pr-9 text-[14px] placeholder:text-graphite focus-visible:ring-retail-ink"
        />
        {value ? (
          <button
            type="button"
            aria-label="مسح البحث"
            className="absolute top-1/2 left-3 -translate-y-1/2 text-graphite hover:text-carbon-ink"
            onClick={() => setValue("")}
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        ) : null}
      </div>
    </form>
  );
}
