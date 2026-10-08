import { describe, expect, it } from "vitest";
import {
  announcementGradientCss,
  parseGradientAngle,
  parseHexColor,
  parseLogoUrl,
  parseStorefrontBranding,
  serializeStorefrontBranding,
} from "@/lib/store-branding";

describe("storefront branding parsers", () => {
  it("accepts six-digit hex and rejects other color forms", () => {
    expect(parseHexColor("#A92222")).toBe("#a92222");
    expect(parseHexColor("#5c1010")).toBe("#5c1010");
    expect(parseHexColor("a92222")).toBeNull();
    expect(parseHexColor("#fff")).toBeNull();
    expect(parseHexColor("rgb(169, 34, 34)")).toBeNull();
  });

  it("accepts angles 0–360 only", () => {
    expect(parseGradientAngle(0)).toBe(0);
    expect(parseGradientAngle(90)).toBe(90);
    expect(parseGradientAngle("360")).toBe(360);
    expect(parseGradientAngle(361)).toBeNull();
    expect(parseGradientAngle(-1)).toBeNull();
    expect(parseGradientAngle("90.5")).toBeNull();
  });

  it("rejects javascript, url(), and non-http logo values", () => {
    expect(parseLogoUrl("")).toBe("");
    expect(parseLogoUrl("https://cdn.example/logo.png")).toBe("https://cdn.example/logo.png");
    expect(parseLogoUrl("javascript:alert(1)")).toBeNull();
    expect(parseLogoUrl("url(https://evil)")).toBeNull();
    expect(parseLogoUrl("data:text/html,hi")).toBeNull();
  });

  it("serializes a complete payload and drops invalid CSS", () => {
    const ok = serializeStorefrontBranding({
      logoUrl: "https://cdn.example/brands/logo.svg",
      gradientStart: "#5c1010",
      gradientMid: "#a92222",
      gradientEnd: "#2a0a0a",
      gradientAngle: 90,
      marqueeEnabled: true,
    });
    expect(ok?.logoUrl).toBe("https://cdn.example/brands/logo.svg");
    expect(ok?.gradientMid).toBe("#a92222");

    expect(
      serializeStorefrontBranding({
        logoUrl: "javascript:void(0)",
        gradientStart: "#5c1010",
        gradientMid: null,
        gradientEnd: "#2a0a0a",
        gradientAngle: 90,
        marqueeEnabled: true,
      }),
    ).toBeNull();
  });

  it("builds a linear-gradient from validated tokens only", () => {
    const branding = parseStorefrontBranding({
      logoUrl: "",
      gradientStart: "#5c1010",
      gradientMid: "#a92222",
      gradientEnd: "#2a0a0a",
      gradientAngle: 90,
      marqueeEnabled: true,
    });
    expect(announcementGradientCss(branding)).toBe("linear-gradient(90deg, #5c1010, #a92222, #2a0a0a)");
  });
});
