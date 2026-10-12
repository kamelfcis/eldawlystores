import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DestinationPicker } from "@/components/admin/destination-picker";
import { ImageUrlField } from "@/components/admin/image-url-field";
import {
  categoryDestinationPath,
  inferDestinationKind,
  productDestinationPath,
} from "@/lib/admin/destination-url";

const homepagePage = readFileSync("app/(admin)/admin/homepage/page.tsx", "utf8");
const imageUrlFieldSource = readFileSync("components/admin/image-url-field.tsx", "utf8");
const bannerFormSource = readFileSync("components/admin/catalog-forms.tsx", "utf8");
const destinationPickerSource = readFileSync("components/admin/destination-picker.tsx", "utf8");
const searchRoute = readFileSync("app/api/admin/products/search/route.ts", "utf8");
const queriesSource = readFileSync("lib/admin/queries.ts", "utf8");

describe("destination url helpers", () => {
  it("infers preset and catalog paths", () => {
    expect(inferDestinationKind("/")).toBe("home");
    expect(inferDestinationKind("/products")).toBe("products");
    expect(inferDestinationKind("/products/iphone-16")).toBe("product");
    expect(inferDestinationKind("/categories/laptops")).toBe("category");
    expect(inferDestinationKind("/about")).toBe("custom");
  });

  it("builds product and category paths", () => {
    expect(productDestinationPath("iphone-16")).toBe("/products/iphone-16");
    expect(categoryDestinationPath("laptops")).toBe("/categories/laptops");
  });
});

describe("ImageUrlField reset", () => {
  it("resets local url when defaultValue or resetKey changes", () => {
    expect(imageUrlFieldSource).toContain("useEffect(() => {");
    expect(imageUrlFieldSource).toContain("setUrl(defaultValue)");
    expect(imageUrlFieldSource).toContain("[defaultValue, resetKey]");
  });

  it("renders hero and announcement preview classes from BannerForm", () => {
    expect(bannerFormSource).toContain("aspect-video");
    expect(bannerFormSource).toContain('previewFit = type === "announcement" ? "contain" : "cover"');
    expect(bannerFormSource).toContain("resetKey={formKey}");
  });
});

describe("BannerForm controlled state", () => {
  it("keeps controlled fields and destination picker wiring", () => {
    expect(bannerFormSource).toContain('value={titleAr}');
    expect(bannerFormSource).toContain('value={linkUrl}');
    expect(bannerFormSource).toContain("DestinationPicker");
    expect(bannerFormSource).toContain('name="image_url"');
    expect(bannerFormSource).not.toContain('name="link_url" defaultValue');
  });

  it("accepts categories for the destination picker", () => {
    expect(bannerFormSource).toContain("categories: AdminCategoryOption[]");
    const html = renderToStaticMarkup(
      createElement(DestinationPicker, {
        categories: [{ id: "c1", name_ar: "هواتف", slug: "phones" }],
        value: "/categories/phones",
        onChange: () => undefined,
      })
    );
    expect(html).toContain("وجهة الرابط");
    expect(html).toContain('name="link_url"');
    expect(html).toContain("هواتف");
  });
});

describe("admin homepage edit links", () => {
  it("opens the editor with ?edit= and remounts BannerForm on id change", () => {
    expect(homepagePage).toContain("?edit=new&type=");
    expect(homepagePage).toContain("?edit=${banner.id}");
    expect(homepagePage).toContain("key={editing?.type === section.type ? editing.id : `new-${section.type}`}");
    expect(homepagePage).toContain("border-t-category-blue");
    expect(homepagePage).toContain("border-t-category-teal");
    expect(homepagePage).toContain("border-t-category-amber");
    expect(homepagePage).toContain("getAdminCategoryOptions");
  });
});

describe("destination picker and product search", () => {
  it("debounces product search and keeps hidden link_url input", () => {
    expect(destinationPickerSource).toContain('name={name}');
    expect(destinationPickerSource).toContain("setTimeout(() => setDebouncedQuery");
    expect(destinationPickerSource).toContain("/api/admin/products/search?q=");
  });

  it("exposes searchAdminProducts guarded by assertAdmin", () => {
    expect(queriesSource).toContain("export async function searchAdminProducts");
    expect(queriesSource).toContain("await assertAdmin()");
    expect(searchRoute).toContain("searchAdminProducts");
  });
});

describe("ImageUrlField preview markup", () => {
  it("supports contain preview for announcement chips", () => {
    const html = renderToStaticMarkup(
      createElement(ImageUrlField, {
        name: "image_url_display",
        defaultValue: "https://example.com/logo.png",
        r2Enabled: false,
        placeholder: "https://",
        folder: "banners",
        previewClassName: "h-9 w-[72px]",
        previewFit: "contain",
        resetKey: "announcement-1",
      })
    );
    expect(html).toContain("object-contain");
    expect(html).toContain("logo.png");
  });
});
