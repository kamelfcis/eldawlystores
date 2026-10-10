import { afterEach, describe, expect, it } from "vitest";
import {
  PLACEHOLDER_PRODUCT_IMAGE,
  resolveOrderItemImageUrl,
} from "@/lib/orders/variant-images";

describe("resolveOrderItemImageUrl", () => {
  const previousPublic = process.env.R2_PUBLIC_URL;

  afterEach(() => {
    if (previousPublic === undefined) delete process.env.R2_PUBLIC_URL;
    else process.env.R2_PUBLIC_URL = previousPublic;
  });

  it("keeps absolute https urls", () => {
    expect(resolveOrderItemImageUrl("https://cdn.example/phone.jpg")).toBe("https://cdn.example/phone.jpg");
  });

  it("resolves bare storage keys via getPublicUrl", () => {
    process.env.R2_PUBLIC_URL = "https://cdn.example";
    expect(resolveOrderItemImageUrl("products/phone.jpg")).toBe("https://cdn.example/products/phone.jpg");
  });

  it("falls back to placeholder for relative paths", () => {
    expect(resolveOrderItemImageUrl("/placeholder-product.svg")).toBe(PLACEHOLDER_PRODUCT_IMAGE);
    expect(resolveOrderItemImageUrl("../secret.jpg")).toBe(PLACEHOLDER_PRODUCT_IMAGE);
  });

  it("falls back to placeholder when url is missing or invalid", () => {
    expect(resolveOrderItemImageUrl(undefined)).toBe(PLACEHOLDER_PRODUCT_IMAGE);
    expect(resolveOrderItemImageUrl("javascript:alert(1)")).toBe(PLACEHOLDER_PRODUCT_IMAGE);
  });
});
