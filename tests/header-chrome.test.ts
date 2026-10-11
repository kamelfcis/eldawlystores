import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { guestAccountLinks, signedInAccountLinks } from "@/components/account/storefront-account-links";

const header = readFileSync("components/layout/header.tsx", "utf8");
const drawer = readFileSync("components/layout/mobile-store-drawer.tsx", "utf8");
const mega = readFileSync("components/layout/category-mega-menu.tsx", "utf8");
const skeleton = readFileSync("components/loading/skeletons.tsx", "utf8");

describe("mobile header chrome", () => {
  it("puts the hamburger first and search+cart in the ms-auto cluster", () => {
    const mobileStart = header.indexOf("relative z-10 shrink-0 lg:hidden");
    const logo = header.indexOf("StoreLogo logoUrl={logoUrl} align=\"center\"");
    const leftCluster = header.indexOf("relative z-10 ms-auto");
    const search = header.indexOf("<MobileSearchDialog");
    const mobileCart = header.indexOf("CartDrawerTrigger className");
    expect(mobileStart).toBeGreaterThan(-1);
    expect(header.indexOf("<MobileStoreDrawer")).toBeGreaterThan(mobileStart);
    expect(logo).toBeGreaterThan(mobileStart);
    expect(leftCluster).toBeGreaterThan(logo);
    expect(search).toBeGreaterThan(leftCluster);
    expect(mobileCart).toBeGreaterThan(search);
    expect(header).toContain("flex h-16");
  });

  it("keeps desktop account, wishlist, and mega menu off the mobile chrome", () => {
    expect(header).toContain("hidden items-center gap-1 lg:flex");
    expect(header).toContain("<CategoryMegaMenu categories={categories} />");
    expect(header).toContain("<AccountMenuButton");
    expect(mega).not.toContain("MobileStoreDrawer");
    expect(mega).not.toContain("placement");
  });
});

describe("mobile store drawer IA", () => {
  it("still renders when the catalog is empty", () => {
    expect(drawer).toContain("export function MobileStoreDrawer");
    expect(drawer).not.toContain("categories.length === 0");
    expect(header).toContain("MobileStoreDrawer");
  });

  it("is a start-edge sheet labeled القائمة", () => {
    expect(drawer).toContain('aria-label="القائمة"');
    expect(drawer).toContain("w-[min(360px,88vw)]");
    expect(drawer).toContain("h-dvh");
    expect(drawer).toContain("start-0");
    expect(drawer).toContain("store-drawer-sheet");
    expect(drawer).not.toContain("inset-0 top-0 left-0");
  });

  it("lists signed-in destinations including orders and logout", () => {
    expect(signedInAccountLinks(false).map((link) => link.href)).toEqual([
      "/account",
      "/account/orders",
      "/account/profile",
      "/account/addresses",
      "/wishlist",
    ]);
    expect(signedInAccountLinks(true).some((link) => link.href === "/admin")).toBe(true);
    expect(guestAccountLinks().map((link) => link.href)).toEqual([
      "/account/login",
      "/account/signup",
      "/wishlist",
    ]);
    expect(drawer).toContain("signedInAccountLinks");
    expect(drawer).toContain("action={logout}");
    expect(drawer).not.toContain("text-ember");
    expect(drawer).not.toContain("text-retail-red");
  });
});

describe("header skeleton", () => {
  it("places the hamburger slot first so it sits on the visual right in RTL", () => {
    expect(skeleton).toContain("export function HeaderSkeleton");
    const start = skeleton.indexOf("export function HeaderSkeleton");
    const firstSlot = skeleton.indexOf("relative z-10 size-11 shrink-0", start);
    const leftCluster = skeleton.indexOf("relative z-10 ms-auto", start);
    expect(firstSlot).toBeGreaterThan(start);
    expect(leftCluster).toBeGreaterThan(firstSlot);
  });
});
