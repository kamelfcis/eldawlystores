# Doly Stores — Design System

Arabic-first adaptation of the Peak Design Refero spec in `docs/DESIGN (1).md`. One token system. Layouts use `dir="rtl"`.

## Colors

| Name | Value | Token | Role |
|------|-------|-------|------|
| Carbon Ink | `#1a211e` | `--color-carbon-ink` | Admin text, icons, and filled controls |
| Paper White | `#ffffff` | `--color-paper-white` | Canvas, cards, filled buttons on dark panels |
| True Black | `#000000` | `--color-true-black` | Sharpest edge only |
| Obsidian | `#0c0c0c` | `--color-obsidian` | Hero and deep panels |
| Fog | `#eef1f0` | `--color-fog` | Search field, soft wells |
| Mist | `#e0e0e0` | `--color-mist` | Header hairline, section dividers |
| Graphite | `#606562` | `--color-graphite` | Secondary text, metadata |
| Ash Border | `#cccfcd` | `--color-ash-border` | Inputs, inactive pills |
| Slate | `#363537` | `--color-slate` | Nav and pill text |
| Pewter | `#4e4e4e` | `--color-pewter` | Neutral badges |
| Ember Red | `#cc2e39` | `--color-ember-red` | Admin discount or low-stock badge |
| Retail Canvas | `#ffffff` | `--color-retail-canvas` | Storefront page background |
| Retail Ink | `#141414` | `--color-retail-ink` | Storefront text |
| Retail Muted | `#6b6b6b` | `--color-retail-muted` | Storefront secondary text |
| Retail Line | `#e5e5e5` | `--color-retail-line` | Storefront borders and category rings |
| Retail Red | `#a92222` | `--color-retail-red` | Current price, the `يوفر` line, the hero CTA, and the خصم badge |
| Category Teal | `#0f6e6b` | `--color-category-teal` | Category pill mark and offer-card bar |
| Category Blue | `#1d4e89` | `--color-category-blue` | Category pill mark and offer-card bar |
| Category Amber | `#c47b12` | `--color-category-amber` | Category pill mark and offer-card bar |
| Category Violet | `#5c4d8a` | `--color-category-violet` | Category pill mark and offer-card bar |

`docs/DESIGN (1).md` stays the token source. This file is the Arabic storefront adaptation.

The default is still flat: no shadows, no page gradients, no glass. The admin workspace keeps carbon ink, ember red, and the category colors. Ember red is an admin badge color, not a storefront button or price color. Retail red `#a92222` stays on the current price, the `يوفر` line, the hero CTA, and the خصم badge. The four category colors repeat in this order — teal, blue, amber, violet — by category `sort_order` on filter pills. They are not used on the storefront page background or the homepage canvas.

## Depth override

The flat no-shadow rule is lifted only for admin dashboard metric tiles and chart cards, category circles, product cards, and the discount badge. Every other surface stays flat, including the page, the carbon marquee, the obsidian hero, editors, and the latest-orders and low-stock lists.

Allowed shadow: `0 8px 24px rgb(26 33 30 / 0.06)`. No page gradients. No glass.

The خصم badge uses a smaller shadow, `0 2px 6px rgb(26 33 30 / 0.12)`, so the pill stays slight. Category discs also carry a 1px inner highlight: `inset 0 0 0 1px rgb(255 255 255 / 0.9)`.

## Arabic type

IBM Plex Sans Arabic for body, prices, product names, nav, buttons, eyebrows, and display headlines. IBM Plex Mono for SKUs only. Latin model names may stay in the Latin glyphs of the same sans.

| Role | Face | Weight | Size | Tracking |
|------|------|--------|------|----------|
| Body, prices, product names | IBM Plex Sans Arabic | 400 | 14px / 16px | none |
| Nav, buttons, eyebrows | IBM Plex Sans Arabic | 700 | 14px / 16px | 0.038em / 0.057em |
| Display headlines | IBM Plex Sans Arabic | 400 | 48px | -0.025em, line-height 1.10 |
| SKU | IBM Plex Mono | 400 | 14px | none |

Do not uppercase Arabic. Do not set Arabic headlines in an italic Latin serif.

## Spacing and radius

4px base. Controls and inputs 4px. Cards and product images 8px. Badges and filter pills fully rounded. Page content max 1440px. Product cards separated by 24px. Section rhythm 80px. Tailwind's default spacing scale matches these steps (`gap-6` = 24px). Do not redefine `--spacing-*` inside `@theme`.

## Surfaces

| Level | Token | Value |
|-------|-------|-------|
| Canvas | `--color-paper-white` | `#ffffff` |
| Soft | `--color-fog` | `#eef1f0` |
| Hairline | `--color-mist` | `#e0e0e0` |
| Deep panel | `--color-obsidian` | `#0c0c0c` |

## Storefront

White canvas, near-black text, gray secondary text, gray borders, and one retail red. Retail red is `#a92222`, sampled from the live storefront sale-price token `rgb(169, 34, 34)`. The fallback `#E10600` was not used. Red is the current price, the `يوفر` line, the hero CTA, and the خصم badge. The announcement bar is carbon ink. Product cards use a hairline and the allowed depth shadow. Product and banner images use an 8px radius. IBM Plex Sans Arabic stays the storefront face. The admin shell stays on the carbon workspace.

Homepage order:

1. Announcement bar: carbon ink, white 14px weight 700, RTL, from active `homepage_banners` where `type = announcement`. Desktop is a marquee (clone, 36s, hover pause). Touch and reduced motion stay a horizontal scroller. An Arabic fallback line shows when no announcement exists. An optional image is 28px. `getBanners` returns database rows as-is when Supabase is configured; mock banners are only used when Supabase is not configured.
2. Obsidian split hero: from `lg`, a two-column grid — the first active `type = hero` banner is a ~2/3 `#0c0c0c` panel (min-height about 500px) with a paper-white bold title, fog subtitle, a large 8px cover from that banner’s `image_url` (`object-cover`), and a retail-red button only when `link_url` exists. Remaining hero banners and every `type = offer` banner are bordered paper cards. The photo is about 16:10 and roughly 70% of the card height, with a compact carbon-ink title and graphite subtitle underneath. The sidebar stack is capped at 3 and matches the panel height. Extra cards wrap under the split in a tight 2–3 column row. Below `lg` the panel is full width and cards sit under it. No banners means no hero. No extra slogans.
3. Category rail: section label `تسوق حسب القسم` in retail ink. 88px raised discs filled edge to edge (`object-cover`, `object-center`) from `categories.image_url`, so the photo fills the circle. Each disc has the allowed depth shadow, a retail-line ring, and a 1px paper inner highlight. Desktop hover lifts `translate-y-[-2px]` with no scale, rotate, or photo overlay. `prefers-reduced-motion` skips the lift. Arabic name, desktop arrows, swipe below `md`, link `/categories/[slug]`. An empty image stays a solid `#f3f3f3` disc. A hairline separates the rail from the hero.
4. One product rail per category that has active products, 12 products maximum. The title is the category name in retail ink. `عرض الكل` is a retail-ink link to `/categories/[slug]`. A hairline and 40–48px padding (`mt-10 pt-10` / `lg:mt-12 lg:pt-12`) separate the hero, categories, and each rail.

Product cards are shared by rails, `/products`, and category pages. Each card has a retail-line hairline, an 8px radius, and the allowed depth shadow. The name is two lines. The image stays `object-contain`. The price uses `formatMoney` in retail red. When `compare_at` is higher than the price, the card shows one pill `خصم {n}%`, where `n` is `Math.round((1 - price / compareAt) * 100)`, on a retail-red ground with paper-white type, full radius, and the slight badge shadow. The gray struck compare-at and `يوفر {formatMoney(compare − price)}` stay with that badge. No compare-at means no badge and no `يوفر` line. Stock reads `متوفر`, `مخزون منخفض` for 1–5, and `نفذت الكمية` at 0. Quick add sits below the image. The product page price block uses the same price, badge, savings, and stock language.

### Product gallery

The product page stays a server component. `components/product/product-gallery.tsx` is the only client island. The main frame is 1:1, 8px radius, fog well, `object-contain`. Alt text is `product_images.alt_text`, then the product name. Zero images use `/placeholder-product.svg`. One image has no thumbnail row. Each extra image is a 64px thumbnail; click, Enter, or Space sets the main image. The active thumbnail uses a retail-ink ring. Keyboard focus is a visible retail-ink outline.

### Homepage rhythm

Keep the order: carbon announcement marquee, obsidian split hero, category circles, then product rails. Do not restore a white carousel or a red ticker. Section hairlines stay `mt-10 pt-10` / `lg:mt-12 lg:pt-12`. The hero title steps 28 / 40 / 48px at leading 1.10. The category label is 16px bold; rail titles are 24px bold and share a baseline with `عرض الكل`. Category discs are 88px, raised, `object-cover` edge to edge, with a retail-line ring that does not inset the photo. Disc arrows sit on the circle’s vertical center. Rail arrows use the retail line, and the control row sits 12px above the cards.

## Admin dashboard

Carbon workspace. Shared editor cards stay paper white, mist border, 8px radius, and flat. Dashboard metric tiles and chart cards are the exception: paper white, mist hairline, 8px radius, and the allowed depth shadow. Order on `/admin`: header, metric tiles, trend charts, status breakdown, then the existing latest-orders and low-stock lists. Those two lists stay flat.

Each metric tile has one Lucide icon, a 2px colored top edge, and no gradient fill.

| Tile | Icon | Color |
|------|------|-------|
| طلبات اليوم | `ShoppingBag` | Blue `#1d4e89` |
| الإيرادات | `Banknote` | Teal `#0f6e6b` |
| متوسط الطلب | `Receipt` | Violet `#5c4d8a` |
| مخزون منخفض | `TriangleAlert` | Ember `#cc2e39` |

[`components/admin/admin-nav.tsx`](components/admin/admin-nav.tsx) puts a 16px Lucide icon beside each Arabic label. The active item stays carbon ink on fog.

| Label | Icon |
|-------|------|
| لوحة التحكم | `LayoutDashboard` |
| الطلبات | `ShoppingBag` |
| المنتجات | `Package` |
| الفئات | `Layers` |
| العلامات | `Tag` |
| العروض | `BadgePercent` |
| الصفحة الرئيسية | `House` |
| الإعدادات | `Settings` |

Charts use Recharts only. The browser receives 14 aggregated Cairo days, not order rows. Each day is present even when its count is zero. Chart headers carry an icon: orders `ChartColumn` in blue, revenue `Banknote` in teal, status `ChartBar` in carbon ink.

| Chart | Measure | Empty state |
|-------|---------|-------------|
| الطلبات يوميًا | Order count, all statuses | لا توجد طلبات خلال آخر 14 يومًا. |
| الإيرادات يوميًا | Integer piasters, shown with `formatMoney`. Excludes cancelled and rejected | لا توجد إيرادات خلال آخر 14 يومًا. |
| الطلبات حسب الحالة | Real counts, Arabic labels, links to `/admin/orders?status=` | لا توجد طلبات لعرضها حسب الحالة. |

Status colors: pending amber `#c47b12`, confirmed blue `#1d4e89`, shipped teal `#0f6e6b`, delivered violet `#5c4d8a`, cancelled and rejected ember `#cc2e39`. The status chart is horizontal so the Arabic labels stay readable. Orders/day bars are blue `#1d4e89`. Revenue/day bars are teal `#0f6e6b`. An all-zero series renders the Arabic empty line, centered in the chart frame (`h-56`, status `h-64`), and no axes or bars. Status links stay under the chart, including when every count is zero.

## Next commerce layer

Built:

- WhatsApp floater, shown only when a store number is set
- Breadcrumb on category and product pages
- Quick view on the product card
- Wishlist in localStorage, with a heart toggle and `/wishlist`
- Compare: up to 3 products in localStorage, قارن on the card and product page, a bottom tray in the store layout, and `/compare?ids=` for shared links using existing catalog fields only
- Mega menu: الأقسام in the header — desktop panel and mobile sheet with category images and names, plus عرض كل الأقسام to `/categories`

Not built:

- Reviews — no review table in the catalog
- Installments — no installment payment provider integrated
- Countdown deals — no banner end time on homepage offers

## RTL and responsive

The document is `dir="rtl"`. Chart plots are `dir="ltr"` so the 14 days read oldest to newest, left to right, with Arabic day labels. Trend charts stack in one column below `lg` and sit side by side from `lg`. The status chart is full width. Category and product rails scroll horizontally on touch; arrows show from `md`. Homepage content stays inside the 1440px frame with 16px page padding. The carbon marquee is full width. Below `lg` the hero panel is full width and offer cards sit under it.

Upload sizes shown on the admin image fields:

| Use | Upload | Frame |
|-----|--------|-------|
| Category | 512×512 (1:1) | 88px circle, `object-cover` |
| Brand logo | 400×400 PNG | Logo field |
| Hero cover | 1600×1000 (16:10) | First active hero `image_url`, large cover on the obsidian panel |
| Offer | 1200×800 (3:2) | About 16:10, roughly 70% of the card |
| Announcement icon | 112×112, optional | 28px in the carbon-ink bar |
| Product photo | 1200×1200 (1:1) | Square card, `object-contain` |

## Money

Integer piasters as EGP: `formatMoney(499900)` → `4,999.00 ج.م`
