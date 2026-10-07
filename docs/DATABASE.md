# Doly Stores — Database Schema

## Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profile (extends auth.users) |
| `user_roles` | Admin/customer role (locked, not user_metadata) |
| `categories` | Product categories with Arabic names |
| `brands` | Product brands |
| `products` | Product records with slug, status |
| `product_images` | Product gallery images |
| `product_variants` | SKU, price, compare_at, cost_price, stock |
| `attribute_definitions` | Category-scoped attributes (color, storage, RAM) |
| `variant_attribute_values` | Variant attribute values |
| `inventory_movements` | Stock change audit trail |
| `carts` / `cart_items` | Persistent shopping carts |
| `orders` / `order_items` | Order records |
| `order_status_history` | Status transition audit |
| `addresses` | Customer shipping addresses |
| `promotions` / `promotion_usages` | Discount codes |
| `homepage_banners` | Hero banner content |
| `shipping_rates` | Per-governorate delivery fees |
| `settings` | Key-value store config |

## RLS Summary

- **Public catalog**: SELECT where `status = 'active'`
- **Customers**: own profile, addresses, carts, orders
- **Admins**: `private.is_admin()` grants full access
- **cost_price**: excluded from anon/authenticated grants
- **orders INSERT**: service role only (no anonymous insert)

## Indexes

- Unique slugs and SKUs
- `products(category_id, status)`, `products(brand_id)`
- `orders(status, created_at DESC)`
- Arabic `tsvector` on product name/description
- Variant attribute filter indexes

## Realtime

Publication includes `orders` table only.

## Applying Migrations

See `docs/DEPLOYMENT.md`. Migrations live in `supabase/migrations/`.
