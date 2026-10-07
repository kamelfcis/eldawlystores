"use client";

import { useState } from "react";
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
}: {
  name: string;
  defaultValue: string;
  r2Enabled: boolean;
  placeholder: string;
  folder: "products" | "banners" | "brands" | "categories";
  hint?: string;
}) {
  const [url, setUrl] = useState(defaultValue);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setMessage("");
    setUploading(true);

    const body = new FormData();
    body.append("file", file);
    body.append("folder", folder);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body,
      });
      const data = (await res.json().catch(() => ({}))) as {
        status?: string;
        publicUrl?: string;
        error?: string;
      };

      if (data.status === "not-configured" || res.status === 503) {
        setMessage("رفع الصور غير مُعد");
        return;
      }
      if (!res.ok || data.status !== "uploaded" || !data.publicUrl) {
        setMessage(data.error || "فشل رفع الملف");
        return;
      }
      setUrl(data.publicUrl);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      {r2Enabled ? (
        <label className={uploading ? `${browseClass} pointer-events-none opacity-50` : browseClass}>
          {uploading ? "جارٍ الرفع…" : "اختيار صورة"}
          <input type="file" accept="image/*" disabled={uploading} onChange={onFile} className="sr-only" />
        </label>
      ) : (
        <p className="text-xs text-graphite">رفع الصور غير مُعد</p>
      )}
      {hint ? <p className="text-xs text-graphite">{hint}</p> : null}
      {url ? (
        <div className="h-[72px] w-[72px] overflow-hidden rounded-[8px] border border-mist bg-fog">
          <img src={url} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}
      <details className="rounded-[8px] border border-mist bg-paper-white px-3 py-2">
        <summary className="cursor-pointer text-[14px] text-graphite">رابط اختياري</summary>
        <div className="pt-2">
          <Input name={name} value={url} onChange={(event) => setUrl(event.target.value)} placeholder={placeholder} />
        </div>
      </details>
      {message ? <p className="text-xs text-ember-red">{message}</p> : null}
    </div>
  );
}
