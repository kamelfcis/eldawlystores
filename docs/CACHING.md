# Doly Stores — Caching Strategy

## TanStack Query Keys

| Group | Key pattern | staleTime |
|-------|-------------|-----------|
| `products` | `['products', filters]` | 5 min |
| `product` | `['product', slug]` | 5 min |
| `categories` | `['categories']` | 10 min |
| `brands` | `['brands']` | 10 min |
| `cart` | `['cart', userId \| sessionId]` | 30 sec |
| `orders` | `['orders', userId]` | 1 min |
| `profile` | `['profile', userId]` | 2 min |
| `promotions` | `['promotions']` | 5 min |
| `admin-metrics` | `['admin-metrics']` | 30 sec |

User-specific keys always include the user id or session id.

## Invalidation Rules

| Event | Invalidates |
|-------|-------------|
| Admin product save | product, products list, category products |
| Order status change | order, customer orders, admin queue, metrics |
| Cart mutation | cart |
| Checkout complete | cart, orders |

## Realtime Patching

Admin order queue uses Supabase Realtime INSERT/UPDATE to patch the TanStack Query cache instead of full refetch.

## Server Components

Catalog pages use Next.js fetch caching with `revalidate` where appropriate. User-specific data is never cached at CDN level.
