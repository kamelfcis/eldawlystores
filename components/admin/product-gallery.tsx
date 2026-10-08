"use client";

import { useId, useState } from "react";
import { UploadProgress } from "@/components/loading/upload-progress";
import { useDeferredBusy } from "@/components/loading/use-deferred-busy";
import { uploadAdminFile } from "@/lib/loading/upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const browseClass =
  "inline-flex h-8 cursor-pointer items-center rounded-[4px] border border-carbon-ink bg-transparent px-3 text-[14px] font-bold tracking-[0.038em] text-carbon-ink hover:bg-fog";

export interface GalleryDraft {
  key: string;
  id: string;
  url: string;
  sort_order: number;
  primary: boolean;
}

export function galleryFromImages(images: Array<{ id: string; url: string; sort_order: number }>): GalleryDraft[] {
  if (images.length === 0) {
    return [{ key: "new-0", id: "", url: "", sort_order: 0, primary: true }];
  }
  return images.map((image, index) => ({
    key: image.id || `saved-${index}`,
    id: image.id,
    url: image.url,
    sort_order: image.sort_order,
    primary: index === 0,
  }));
}

export function ProductGalleryField({ initial, r2Enabled }: { initial: GalleryDraft[]; r2Enabled: boolean }) {
  const [rows, setRows] = useState(initial);
  const [message, setMessage] = useState("");
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(0);
  const [total, setTotal] = useState(0);
  const uploadId = useId();
  const showUpload = useDeferredBusy(uploadingKey != null);

  function update(key: string, patch: Partial<GalleryDraft>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function markPrimary(key: string) {
    setRows((current) => current.map((row) => ({ ...row, primary: row.key === key })));
  }

  function remove(key: string) {
    setRows((current) => {
      const next = current.filter((row) => row.key !== key);
      if (next.length === 0) return [{ key: `new-${Date.now()}`, id: "", url: "", sort_order: 0, primary: true }];
      if (!next.some((row) => row.primary)) next[0] = { ...next[0], primary: true };
      return next;
    });
  }

  async function onFile(key: string, file: File | undefined) {
    if (!file || uploadingKey) return;
    setMessage("");
    setLoaded(0);
    setTotal(0);
    setUploadingKey(key);
    try {
      const result = await uploadAdminFile(file, "products", uploadId, (nextLoaded, nextTotal) => {
        setLoaded(nextLoaded);
        setTotal(nextTotal);
      });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      update(key, { url: result.publicUrl });
    } finally {
      setUploadingKey(null);
      setLoaded(0);
      setTotal(0);
    }
  }

  return (
    <div className="space-y-3 sm:col-span-2">
      <p className="text-[14px] text-graphite">الصورة الأساسية تظهر أولاً في المتجر. الترتيب يُحفظ كما هو لباقي الصور ثم تُقدَّم الأساسية.</p>
      {!r2Enabled ? <p className="text-[14px] text-carbon-ink">رفع الصور غير مُعد</p> : null}
      {message ? <p className="text-[14px] text-carbon-ink">{message}</p> : null}
      <UploadProgress active={uploadingKey != null} loaded={loaded} total={total} />
      <input type="hidden" name="images_json" value={JSON.stringify(rows)} />
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.key} className="grid gap-3 rounded-[8px] border border-mist bg-paper-white p-3 sm:grid-cols-[72px_1fr]">
            <div className="h-[72px] w-[72px] overflow-hidden rounded-[8px] border border-mist bg-fog">
              {row.url ? <img src={row.url} alt="" className="h-full w-full object-cover" /> : null}
            </div>
            <div className="grid gap-2">
              {r2Enabled ? (
                <label className={uploadingKey === row.key ? `${browseClass} pointer-events-none opacity-50` : browseClass} aria-busy={uploadingKey === row.key}>
                  <span className="grid">
                    <span className={showUpload && uploadingKey === row.key ? "invisible col-start-1 row-start-1" : "col-start-1 row-start-1"}>اختيار صورة</span>
                    <span className={showUpload && uploadingKey === row.key ? "col-start-1 row-start-1" : "invisible col-start-1 row-start-1"} role="status">
                      جارٍ الرفع
                    </span>
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingKey === row.key}
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      void onFile(row.key, file);
                    }}
                  />
                </label>
              ) : null}
              <p className="text-xs text-graphite">المقاس: 1200×1200 (1:1)</p>
              <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
                <details className="rounded-[8px] border border-mist bg-fog px-3 py-2">
                  <summary className="cursor-pointer text-[14px] text-graphite">رابط اختياري</summary>
                  <div className="pt-2">
                    <Input
                      value={row.url}
                      onChange={(event) => update(row.key, { url: event.target.value })}
                      placeholder="رابط الصورة"
                      aria-label="رابط الصورة"
                    />
                  </div>
                </details>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={row.sort_order}
                  onChange={(event) => update(row.key, { sort_order: Number(event.target.value) })}
                  aria-label="ترتيب الصورة"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-[14px]">
                  <input type="radio" checked={row.primary} onChange={() => markPrimary(row.key)} />
                  أساسية
                </label>
                <button type="button" className="text-[14px] text-carbon-ink" onClick={() => remove(row.key)}>
                  إزالة
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() =>
          setRows((current) => [
            ...current,
            { key: `new-${Date.now()}`, id: "", url: "", sort_order: current.length, primary: current.length === 0 },
          ])
        }
      >
        إضافة صورة
      </Button>
    </div>
  );
}
