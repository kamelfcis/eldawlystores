# Doly Stores — Implementation Plan

## Phases

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Docs, scaffold, env example, service boundaries | Complete |
| 2 | Design tokens, UI primitives, layout components | Complete |
| 3 | Supabase migrations, RLS, types | Complete (author only) |
| 4 | Storefront: home, PLP, PDP, cart | Complete |
| 5 | Auth: email/password, Google OAuth, profile, addresses | Complete |
| 6 | Checkout: guest + account, server validation, confirmation | Complete |
| 7 | Admin: dashboard, realtime queue, CRUD shells | Complete |
| 8–9 | R2 storage + Resend email adapters | Complete |
| 10–14 | SEO, tests, security notes, production checklist | Complete |

## Folder Structure

```
app/
  (store)/          Storefront pages
  (account)/        Customer account
  (admin)/          Admin dashboard
  api/              Route handlers
components/
  ui/               Design system primitives
  layout/           Header, footer, announcement bar
  product/          Product cards, gallery, filters
  cart/             Cart drawer, line items
  checkout/         Checkout form
  orders/           Order status, timeline
  admin/            Admin tables, metrics
lib/
  catalog/          Product/category queries
  cart/             Cart persistence
  checkout/         Order creation, validation
  orders/           Order queries, status transitions
  promotions/       Promo code validation
  auth/             Session helpers
  supabase/         Client factories
  email/            Resend adapter
  storage/          R2 adapter
  logging/          Structured logging
supabase/migrations/
docs/
tests/
```

## Conventions

- Arabic-first RTL (`lang="ar" dir="rtl"`)
- Zod at every mutation boundary
- TanStack Query for client server-state
- Mock data fallback when Supabase not configured
