# Doly Stores — Architecture

## Overview

Doly Stores is an Arabic-first Egyptian electronics e-commerce platform built on Next.js App Router, Supabase, TanStack Query, Cloudflare R2, and Resend.

## Layers

```
Browser (RTL Arabic UI)
  → Next.js Route Handlers / Server Components
    → Domain Services (lib/catalog, cart, checkout, orders, promotions, auth)
      → Supabase Postgres (RLS) | R2 (images) | Resend (email)
```

Business logic lives in `lib/*` services. React components are presentational and call hooks that wrap services.

## Route Groups

| Group | Path prefix | Purpose |
|-------|-------------|---------|
| `(store)` | `/`, `/categories/*`, `/products/*`, `/cart`, `/checkout` | Public storefront |
| `(account)` | `/account/*` | Authenticated customer area |
| `(admin)` | `/admin/*` | Admin dashboard (role-gated) |
| `api/` | `/api/*` | Server-only mutations (checkout, uploads) |

## Trust Boundaries

- **Prices, stock, promos, shipping** — calculated server-side only
- **Orders** — created via `/api/checkout` with service-role client inside a Postgres transaction
- **Guest orders** — accessed via unguessable `access_token`, not sequential order numbers
- **Admin role** — stored in `user_roles` + `app_metadata`, checked via `private.is_admin()`
- **cost_price** — never exposed to anon/authenticated roles

## Money

All monetary values stored as integer **piasters** (1 EGP = 100 piasters). No floats.

## Inventory

Stock decremented inside order transaction with row lock. Restored on `cancelled` or `rejected`. Every status change writes `order_status_history`.

## Realtime

Supabase Realtime publication on `orders` table. Admin order queue subscribes to INSERT/UPDATE events.

## Deferred (v1)

- Wishlist
- Product comparison
