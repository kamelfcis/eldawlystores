import { z } from "zod";
import type { Json } from "@/lib/types/database";

export const STOREFRONT_BRANDING_KEY = "storefront_branding";

export const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

export const DEFAULT_STOREFRONT_BRANDING = {
  logoUrl: "",
  gradientStart: "#5c1010",
  gradientMid: "#a92222",
  gradientEnd: "#2a0a0a",
  gradientAngle: 90,
  marqueeEnabled: true,
} as const;

export type StorefrontBranding = {
  logoUrl: string;
  gradientStart: string;
  gradientMid: string | null;
  gradientEnd: string;
  gradientAngle: number;
  marqueeEnabled: boolean;
};

export function parseHexColor(raw: string): string | null {
  const value = raw.trim();
  return HEX_COLOR_RE.test(value) ? value.toLowerCase() : null;
}

export function parseGradientAngle(raw: string | number): number | null {
  if (typeof raw === "number") {
    if (!Number.isInteger(raw) || raw < 0 || raw > 360) return null;
    return raw;
  }
  const trimmed = raw.trim();
  if (!/^\d{1,3}$/.test(trimmed)) return null;
  const angle = Number(trimmed);
  if (!Number.isInteger(angle) || angle < 0 || angle > 360) return null;
  return angle;
}

export function parseLogoUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return "";
  const lower = value.toLowerCase();
  if (lower.includes("url(") || lower.includes("javascript:") || lower.includes("vbscript:")) {
    return null;
  }
  try {
    const parsed = new URL(value, "https://doly.invalid");
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return value;
  } catch {
    return null;
  }
}

const brandingSchema = z.object({
  logoUrl: z.string(),
  gradientStart: z.string().regex(HEX_COLOR_RE),
  gradientMid: z.string().regex(HEX_COLOR_RE).nullable().optional(),
  gradientEnd: z.string().regex(HEX_COLOR_RE),
  gradientAngle: z.number().int().min(0).max(360),
  marqueeEnabled: z.boolean(),
});

export function parseStorefrontBranding(value: Json | null | undefined): StorefrontBranding {
  const record = value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, Json | undefined>) : {};
  const logoRaw = typeof record.logoUrl === "string" ? record.logoUrl : "";
  const logoUrl = parseLogoUrl(logoRaw) ?? "";
  const gradientStart = parseHexColor(typeof record.gradientStart === "string" ? record.gradientStart : "") ?? DEFAULT_STOREFRONT_BRANDING.gradientStart;
  const midRaw = typeof record.gradientMid === "string" ? record.gradientMid.trim() : "";
  const gradientMid = midRaw ? parseHexColor(midRaw) : null;
  const gradientEnd = parseHexColor(typeof record.gradientEnd === "string" ? record.gradientEnd : "") ?? DEFAULT_STOREFRONT_BRANDING.gradientEnd;
  const gradientAngle =
    parseGradientAngle(
      typeof record.gradientAngle === "number" || typeof record.gradientAngle === "string" ? record.gradientAngle : DEFAULT_STOREFRONT_BRANDING.gradientAngle,
    ) ?? DEFAULT_STOREFRONT_BRANDING.gradientAngle;
  const marqueeEnabled = typeof record.marqueeEnabled === "boolean" ? record.marqueeEnabled : DEFAULT_STOREFRONT_BRANDING.marqueeEnabled;

  return {
    logoUrl,
    gradientStart,
    gradientMid,
    gradientEnd,
    gradientAngle,
    marqueeEnabled,
  };
}

export function serializeStorefrontBranding(input: {
  logoUrl: string;
  gradientStart: string;
  gradientMid: string | null;
  gradientEnd: string;
  gradientAngle: number;
  marqueeEnabled: boolean;
}): StorefrontBranding | null {
  const logoUrl = parseLogoUrl(input.logoUrl);
  const gradientStart = parseHexColor(input.gradientStart);
  const gradientMid = input.gradientMid?.trim() ? parseHexColor(input.gradientMid) : null;
  const gradientEnd = parseHexColor(input.gradientEnd);
  const gradientAngle = parseGradientAngle(input.gradientAngle);
  if (logoUrl == null || !gradientStart || !gradientEnd || gradientAngle == null) return null;
  if (input.gradientMid?.trim() && !gradientMid) return null;

  const parsed = brandingSchema.safeParse({
    logoUrl,
    gradientStart,
    gradientMid,
    gradientEnd,
    gradientAngle,
    marqueeEnabled: input.marqueeEnabled,
  });
  if (!parsed.success) return null;
  return {
    logoUrl: parsed.data.logoUrl,
    gradientStart: parsed.data.gradientStart.toLowerCase(),
    gradientMid: parsed.data.gradientMid ? parsed.data.gradientMid.toLowerCase() : null,
    gradientEnd: parsed.data.gradientEnd.toLowerCase(),
    gradientAngle: parsed.data.gradientAngle,
    marqueeEnabled: parsed.data.marqueeEnabled,
  };
}

export function announcementGradientCss(branding: StorefrontBranding): string {
  const stops = branding.gradientMid
    ? `${branding.gradientStart}, ${branding.gradientMid}, ${branding.gradientEnd}`
    : `${branding.gradientStart}, ${branding.gradientEnd}`;
  return `linear-gradient(${branding.gradientAngle}deg, ${stops})`;
}

export function defaultStorefrontBranding(): StorefrontBranding {
  return {
    logoUrl: DEFAULT_STOREFRONT_BRANDING.logoUrl,
    gradientStart: DEFAULT_STOREFRONT_BRANDING.gradientStart,
    gradientMid: DEFAULT_STOREFRONT_BRANDING.gradientMid,
    gradientEnd: DEFAULT_STOREFRONT_BRANDING.gradientEnd,
    gradientAngle: DEFAULT_STOREFRONT_BRANDING.gradientAngle,
    marqueeEnabled: DEFAULT_STOREFRONT_BRANDING.marqueeEnabled,
  };
}
