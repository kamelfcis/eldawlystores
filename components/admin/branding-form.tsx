"use client";

import { useActionState, useMemo, useState } from "react";
import { saveStorefrontBranding } from "@/lib/admin/actions";
import { announcementGradientCss, parseHexColor, type StorefrontBranding } from "@/lib/store-branding";
import { LoadingButton } from "@/components/loading/loading-button";
import { Input } from "@/components/ui/input";
import { ImageUrlField } from "./image-url-field";
import { Field, FormNote, initialFormState } from "./form-bits";

function HexField({
  name,
  label,
  value,
  onChange,
  optional,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  optional?: boolean;
}) {
  const hex = parseHexColor(value);
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={label}
          value={hex ?? "#a92222"}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-10 shrink-0 cursor-pointer rounded-[4px] border border-ash-border bg-paper-white p-1"
        />
        <Input
          name={name}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={optional ? "اختياري #a92222" : "#5c1010"}
          className="font-mono"
        />
      </div>
    </Field>
  );
}

export function BrandingForm({ branding, r2Enabled }: { branding: StorefrontBranding; r2Enabled: boolean }) {
  const [state, action] = useActionState(saveStorefrontBranding, initialFormState);
  const [logoUrl, setLogoUrl] = useState(branding.logoUrl);
  const [gradientStart, setGradientStart] = useState(branding.gradientStart);
  const [gradientMid, setGradientMid] = useState(branding.gradientMid ?? "");
  const [gradientEnd, setGradientEnd] = useState(branding.gradientEnd);
  const [gradientAngle, setGradientAngle] = useState(String(branding.gradientAngle));
  const [marqueeEnabled, setMarqueeEnabled] = useState(branding.marqueeEnabled);

  const preview = useMemo(() => {
    const mid = parseHexColor(gradientMid);
    return announcementGradientCss({
      logoUrl,
      gradientStart: parseHexColor(gradientStart) ?? branding.gradientStart,
      gradientMid: gradientMid.trim() ? mid : null,
      gradientEnd: parseHexColor(gradientEnd) ?? branding.gradientEnd,
      gradientAngle: /^\d{1,3}$/.test(gradientAngle) ? Number(gradientAngle) : branding.gradientAngle,
      marqueeEnabled,
    });
  }, [branding.gradientAngle, branding.gradientEnd, branding.gradientStart, gradientAngle, gradientEnd, gradientMid, gradientStart, logoUrl, marqueeEnabled]);

  return (
    <form action={action} className="space-y-4">
      <Field label="شعار المتجر">
        <ImageUrlField
          name="logoUrl"
          defaultValue={branding.logoUrl}
          r2Enabled={r2Enabled}
          placeholder="https://"
          folder="brands"
          hint="المقاس: حوالي 360×96 بصيغة SVG أو PNG"
          previewFit="contain"
          previewClassName="flex h-12 w-[180px] items-center overflow-hidden rounded-[8px] border border-mist bg-fog px-2"
          onUrlChange={setLogoUrl}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <HexField name="gradientStart" label="بداية التدرج" value={gradientStart} onChange={setGradientStart} />
        <HexField name="gradientMid" label="وسط التدرج" value={gradientMid} onChange={setGradientMid} optional />
        <HexField name="gradientEnd" label="نهاية التدرج" value={gradientEnd} onChange={setGradientEnd} />
        <Field label="زاوية التدرج">
          <Input
            name="gradientAngle"
            inputMode="numeric"
            value={gradientAngle}
            onChange={(event) => setGradientAngle(event.target.value)}
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-[14px] text-carbon-ink">
        <input
          type="checkbox"
          checked={marqueeEnabled}
          onChange={(event) => setMarqueeEnabled(event.target.checked)}
          className="h-4 w-4 rounded-[4px] border-ash-border"
        />
        تشغيل حركة الشريط
      </label>
      <input type="hidden" name="marqueeEnabled" value={marqueeEnabled ? "true" : "false"} />

      <div className="overflow-hidden rounded-[8px] border border-mist">
        <div className="relative h-8 overflow-hidden" style={{ backgroundImage: preview }}>
          <p className="relative z-[1] px-4 text-center text-[14px] font-bold tracking-[0.038em] text-paper-white">
            شحن مجاني للطلبات فوق 5,000 ج.م
          </p>
          <span className="ads-bar-sheen" aria-hidden />
        </div>
        <div className="flex h-12 items-center gap-3 bg-paper-white px-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-8 w-auto max-w-[140px] object-contain" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/branding/doly-wordmark.svg" alt="Doly Stores" className="h-8 w-auto max-w-[140px] object-contain" />
          )}
          <span className="text-[14px] text-graphite">معاينة الشعار وشريط الإعلان</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <LoadingButton type="submit" pendingLabel="جارٍ الحفظ">
          حفظ الهوية
        </LoadingButton>
        <FormNote state={state} />
      </div>
    </form>
  );
}
