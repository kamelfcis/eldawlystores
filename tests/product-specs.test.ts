import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  MAX_SPEC_ROWS,
  parseProductDocument,
  parseSpecsFromFormData,
  unionSpecLabels,
} from "@/lib/catalog/product-specs";
import { ProductSpecs } from "@/components/product/product-specs";

describe("parseProductDocument", () => {
  it("treats empty values as no specs", () => {
    expect(parseProductDocument(null)).toEqual({ specs: [] });
    expect(parseProductDocument({})).toEqual({ specs: [] });
    expect(parseProductDocument("")).toEqual({ specs: [] });
    expect(parseProductDocument("   ")).toEqual({ specs: [] });
  });

  it("drops dirty whitespace and incomplete pairs", () => {
    expect(
      parseProductDocument({
        specs: [
          { label: "  الذاكرة  ", value: "  12 جيجا  " },
          { label: "   ", value: "hidden" },
          { label: "لون", value: "" },
        ],
      })
    ).toEqual({ specs: [{ label: "الذاكرة", value: "12 جيجا" }] });
  });

  it("caps the number of rows", () => {
    const specs = Array.from({ length: MAX_SPEC_ROWS + 5 }, (_, index) => ({
      label: `k${index}`,
      value: `v${index}`,
    }));
    expect(parseProductDocument({ specs }).specs).toHaveLength(MAX_SPEC_ROWS);
  });

  it("returns empty specs for invalid JSON", () => {
    expect(parseProductDocument("{not-json")).toEqual({ specs: [] });
    expect(parseProductDocument("[]")).toEqual({ specs: [] });
  });
});

describe("parseSpecsFromFormData", () => {
  it("prefers paired label/value fields over raw JSON", () => {
    const formData = new FormData();
    formData.set("document", JSON.stringify({ specs: [{ label: "ignored", value: "x" }] }));
    formData.append("specs_label", "  المعالج ");
    formData.append("specs_value", " A18 Pro ");
    formData.append("specs_label", "");
    formData.append("specs_value", "skip");
    expect(parseSpecsFromFormData(formData)).toEqual({ specs: [{ label: "المعالج", value: "A18 Pro" }] });
  });

  it("parses the document field when no spec arrays exist", () => {
    const formData = new FormData();
    formData.set("document", JSON.stringify({ specs: [{ label: "الذاكرة", value: "12 جيجا" }] }));
    expect(parseSpecsFromFormData(formData)).toEqual({ specs: [{ label: "الذاكرة", value: "12 جيجا" }] });
  });
});

describe("unionSpecLabels", () => {
  it("keeps the first product order then extras", () => {
    expect(
      unionSpecLabels([
        { specs: [{ label: "الذاكرة", value: "12" }, { label: "المعالج", value: "A18" }] },
        { specs: [{ label: "المعالج", value: "8E" }, { label: "الشاشة", value: "6.8" }] },
      ])
    ).toEqual(["الذاكرة", "المعالج", "الشاشة"]);
  });
});

describe("storefront specs markup", () => {
  it("renders the expander and hides when empty", () => {
    expect(renderToStaticMarkup(createElement(ProductSpecs, { specs: [] }))).toBe("");
    const html = renderToStaticMarkup(
      createElement(ProductSpecs, { specs: [{ label: "الذاكرة", value: "12 جيجا" }] })
    );
    expect(html).toContain("المواصفات");
    expect(html).toContain("الذاكرة");
    expect(html).toContain("12 جيجا");
    expect(html).toContain("<details");
  });

  it("wires the PDP and compare helpers", () => {
    const pdp = readFileSync("app/(store)/products/[slug]/page.tsx", "utf8");
    const compare = readFileSync("components/compare/compare-view.tsx", "utf8");
    expect(pdp).toContain("ProductSpecs");
    expect(pdp).toContain("product.specs");
    expect(compare).toContain("unionSpecLabels");
    expect(compare).toContain("specValueForLabel");
    expect(compare).toContain('?? "—"');
  });
});
