import { describe, expect, it } from "vitest";
import { parseAdminSettingsTab } from "@/lib/admin/settings-tabs";
import { filterShippingRates, shippingFiltersActive } from "@/lib/admin/shipping-filters";

const rates = [
  { id: "1", governorate: "القاهرة", rate_piasters: 5000 },
  { id: "2", governorate: "الجيزة", rate_piasters: 5000 },
  { id: "3", governorate: "الإسكندرية", rate_piasters: 7000 },
  { id: "4", governorate: "القليوبية", rate_piasters: 7000 },
  { id: "5", governorate: "أسوان", rate_piasters: 8000 },
];

describe("parseAdminSettingsTab", () => {
  it("keeps known tabs and falls back to branding", () => {
    expect(parseAdminSettingsTab("whatsapp")).toBe("whatsapp");
    expect(parseAdminSettingsTab("emails")).toBe("emails");
    expect(parseAdminSettingsTab("shipping")).toBe("shipping");
    expect(parseAdminSettingsTab("branding")).toBe("branding");
    expect(parseAdminSettingsTab("unknown")).toBe("branding");
    expect(parseAdminSettingsTab(undefined)).toBe("branding");
  });
});

describe("filterShippingRates", () => {
  it("matches Arabic governorate names after trim, case-insensitively", () => {
    const filtered = filterShippingRates(rates, {
      query: "  القاهرة  ",
      band: "all",
      minPiasters: "1",
      maxPiasters: "2",
    });
    expect(filtered.map((rate) => rate.governorate)).toEqual(["القاهرة"]);
  });

  it("does not apply a hidden piaster range to other bands", () => {
    const filtered = filterShippingRates(rates, {
      query: "",
      band: "cairo",
      minPiasters: "8000",
      maxPiasters: "9000",
    });
    expect(filtered.map((rate) => rate.governorate)).toEqual(["القاهرة", "الجيزة"]);
  });

  it("applies min/max only for the range band", () => {
    const filtered = filterShippingRates(rates, {
      query: "",
      band: "range",
      minPiasters: "7000",
      maxPiasters: "7000",
    });
    expect(filtered.map((rate) => rate.rate_piasters)).toEqual([7000, 7000]);
  });

  it("filters the rest-of-country band at 8000", () => {
    const filtered = filterShippingRates(rates, {
      query: "",
      band: "rest",
      minPiasters: "",
      maxPiasters: "",
    });
    expect(filtered.map((rate) => rate.governorate)).toEqual(["أسوان"]);
  });
});

describe("shippingFiltersActive", () => {
  it("is inactive on the default all-band empty search", () => {
    expect(shippingFiltersActive({ query: "  ", band: "all", minPiasters: "1", maxPiasters: "9" })).toBe(false);
  });

  it("is active for search or a non-all band", () => {
    expect(shippingFiltersActive({ query: "أسوان", band: "all", minPiasters: "", maxPiasters: "" })).toBe(true);
    expect(shippingFiltersActive({ query: "", band: "range", minPiasters: "", maxPiasters: "" })).toBe(true);
  });
});
