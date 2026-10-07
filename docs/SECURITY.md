# Doly Stores — Security

## Authentication

- `@supabase/ssr` cookie sessions (httpOnly, secure in production)
- Role in `user_roles` table + `app_metadata`, never editable `user_metadata`
- Google OAuth configured in Supabase dashboard

## Authorization

- RLS on all tables — no "allow all" policies
- `private.is_admin()` function in non-exposed schema
- Admin routes gated in middleware + server-side role check
- `cost_price` never granted to anon/authenticated

## Checkout Security

- All totals calculated server-side inside Postgres transaction
- Rate limiting on `/api/checkout` (in-memory, per-IP)
- Guest order access via crypto-random `access_token`
- No client-side order INSERT

## Data Protection

- No secrets in source, docs, or git
- `.env.local` gitignored
- Structured logging without PII or secrets
- Service role key server-only

## Audit Notes (v1)

- [x] RLS policies on all tables
- [x] Server-side price/stock validation
- [x] Guest access tokens (not sequential IDs)
- [x] Admin role not in user_metadata
- [x] Rate limiting on checkout route
- [ ] CSRF: Next.js Route Handlers use same-origin by default
- [ ] Consider Supabase Auth MFA for admin accounts in production
- [ ] Rotate Supabase credentials before first deploy (chat exposure)
- [ ] Enable Supabase Auth email confirmation in production
- [ ] Configure Vercel Firewall rules for admin routes

## Input Validation

Zod schemas at every API boundary. SQL injection prevented by Supabase parameterized queries.
