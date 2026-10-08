"use client";

import { useId, useState } from "react";
import { UploadProgress } from "@/components/loading/upload-progress";
import { useDeferredBusy } from "@/components/loading/use-deferred-busy";
import { uploadAdminFile } from "@/lib/loading/upload";
import { Input } from "@/components/ui/input";

const browseClass =
  "inline-flex h-8 cursor-pointer items-center rounded-[4px] border border-carbon-ink bg-transparent px-3 text-[14px] font-bold tracking-[0.038em] text-carbon-ink hover:bg-fog disabled:pointer-events-none disabled:opacity-50";

export function ImageUrlField({
  name,
  defaultValue,
  r2Enabled,
  placeholder,
  folder,
  hint,
  previewClassName,
  previewFit = "cover",
  onUrlChange,
}: {
  name: string;
  defaultValue: string;
  r2Enabled: boolean;
  placeholder: string;
  folder: "products" | "banners" | "brands" | "categories";
  hint?: string;
  previewClassName?: string;
  previewFit?: "cover" | "contain";
  onUrlChange?: (url: string) => void;
}) {
  const [url, setUrl] = useState(defaultValue);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loaded, setLoaded] = useState(0);
  const [total, setTotal] = useState(0);
  const uploadId = useId();
  const showUpload = useDeferredBusy(uploading);

  function updateUrl(next: string) {
    setUrl(next);
    onUrlChange?.(next);
  }

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || uploading) return;
    setMessage("");
    setLoaded(0);
    setTotal(0);
    setUploading(true);

    try {
      const result = await uploadAdminFile(file, folder, uploadId, (nextLoaded, nextTotal) => {
        setLoaded(nextLoaded);
        setTotal(nextTotal);
      });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      updateUrl(result.publicUrl);
    } finally {
      setUploading(false);
      setLoaded(0);
      setTotal(0);
    }
  }

  return (
    <div className="space-y-2">
      {r2Enabled ? (
        <label className={uploading ? `${browseClass} pointer-events-none opacity-50` : browseClass} aria-busy={uploading}>
          <span className="grid">
            <span className={showUpload ? "invisible col-start-1 row-start-1" : "col-start-1 row-start-1"}>اختيار صورة</span>
            <span className={showUpload ? "col-start-1 row-start-1" : "invisible col-start-1 row-start-1"} role="status">
              جارٍ الرفع
            </span>
          </span>
          <input type="file" accept="image/*" disabled={uploading} onChange={onFile} className="sr-only" />
        </label>
      ) : (
        <p className="text-xs text-graphite">رفع الصور غير مُعد</p>
      )}
      {hint ? <p className="text-xs text-graphite">{hint}</p> : null}
      <UploadProgress active={uploading} loaded={loaded} total={total} />
      {url ? (
        <div className={previewClassName ?? "h-[72px] w-[72px] overflow-hidden rounded-[8px] border border-mist bg-fog"}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className={previewFit === "contain" ? "h-full w-full object-contain" : "h-full w-full object-cover"} />
        </div>
      ) : null}
      <details className="rounded-[8px] border border-mist bg-paper-white px-3 py-2">
        <summary className="cursor-pointer text-[14px] text-graphite">رابط اختياري</summary>
        <div className="pt-2">
          <Input name={name} value={url} onChange={(event) => updateUrl(event.target.value)} placeholder={placeholder} />
        </div>
      </details>
      {message ? <p className="text-xs text-ember-red">{message}</p> : null}
    </div>
  );
}
