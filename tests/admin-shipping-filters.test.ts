import { describe, expect, it } from "vitest";
import { parseAdminSettingsTab } from "@/lib/admin/settings-tabs";
import { filterShippingRates, poundsRangeToPiasters, shippingFiltersActive, SHIPPING_BANDS } from "@/lib/admin/shipping-filters";

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
      minPounds: "1",
      maxPounds: "2",
    });
    expect(filtered.map((rate) => rate.governorate)).toEqual(["القاهرة"]);
  });

  it("does not apply a hidden pound range to other bands", () => {
    const filtered = filterShippingRates(rates, {
      query: "",
      band: "cairo",
      minPounds: "80",
      maxPounds: "90",
    });
    expect(filtered.map((rate) => rate.governorate)).toEqual(["القاهرة", "الجيزة"]);
    expect(filtered.every((rate) => rate.rate_piasters === 5000)).toBe(true);
  });

  it("applies min/max only for the range band and converts pounds to piasters", () => {
    const filtered = filterShippingRates(rates, {
      query: "",
      band: "range",
      minPounds: "70",
      maxPounds: "70",
    });
    expect(filtered.map((rate) => rate.rate_piasters)).toEqual([7000, 7000]);
  });

  it("converts a 50-pound range to 5000 piasters", () => {
    expect(poundsRangeToPiasters("50")).toBe(5000);
    const filtered = filterShippingRates(rates, {
      query: "",
      band: "range",
      minPounds: "50",
      maxPounds: "50",
    });
    expect(filtered.map((rate) => rate.rate_piasters)).toEqual([5000, 5000]);
  });

  it("keeps preset bands on stored piaster values", () => {
    expect(
      filterShippingRates(rates, { query: "", band: "cairo", minPounds: "", maxPounds: "" }).map((rate) => rate.rate_piasters)
    ).toEqual([5000, 5000]);
    expect(
      filterShippingRates(rates, { query: "", band: "alex", minPounds: "", maxPounds: "" }).map((rate) => rate.rate_piasters)
    ).toEqual([7000, 7000]);
    expect(
      filterShippingRates(rates, { query: "", band: "rest", minPounds: "", maxPounds: "" }).map((rate) => rate.rate_piasters)
    ).toEqual([8000]);
  });

  it("filters the rest-of-country band at 8000", () => {
    const filtered = filterShippingRates(rates, {
      query: "",
      band: "rest",
      minPounds: "",
      maxPounds: "",
    });
    expect(filtered.map((rate) => rate.governorate)).toEqual(["أسوان"]);
  });

  it("shows pound labels without piasters", () => {
    expect(SHIPPING_BANDS.map((band) => band.label)).toEqual([
      "الكل",
      "القاهرة/الجيزة (50 ج.م)",
      "الإسكندرية/القليوبية (70 ج.م)",
      "باقي المحافظات (80 ج.م)",
      "نطاق بالجنيه",
    ]);
  });
});

describe("shippingFiltersActive", () => {
  it("is inactive on the default all-band empty search", () => {
    expect(shippingFiltersActive({ query: "  ", band: "all", minPounds: "1", maxPounds: "9" })).toBe(false);
  });

  it("is active for search or a non-all band", () => {
    expect(shippingFiltersActive({ query: "أسوان", band: "all", minPounds: "", maxPounds: "" })).toBe(true);
    expect(shippingFiltersActive({ query: "", band: "range", minPounds: "", maxPounds: "" })).toBe(true);
  });
});
