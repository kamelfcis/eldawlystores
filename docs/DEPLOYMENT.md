# Doly Stores — Deployment

## Prerequisites

- Vercel account
- Supabase project (rotate credentials before use)
- Cloudflare R2 bucket (optional, for image uploads)
- Resend account with verified domain (optional, for emails)

## Environment Variables

Copy `.env.example` to `.env.local` and fill in values. Never commit `.env.local`.

## Database Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Link project (requires access token in env)
supabase link --project-ref your-project-ref

# Apply migrations locally
supabase db push

# Or apply to remote
supabase db push --linked
```

Migrations are in `supabase/migrations/`. Apply only after rotating credentials into `.env.local`.

`20261009073220_egyptian_governorates.sql` inserts the 27 Egyptian governorates into `shipping_rates` with `ON CONFLICT (governorate) DO NOTHING`. It does not remove an existing المنصورة row. Signed-in customers who open `/account/login` or `/account/signup` are redirected to `/account` before the form is shown, including when the URL has `?error=auth`.

`20260930180000_create_checkout_order.sql` adds `create_checkout_order`. Guest checkout calls that function with the server-only `SUPABASE_SERVICE_ROLE_KEY`. Do not put that key in client code or in this document.

## First admin

The live project has one admin, `admin@dolystores.local`. It was created with the Auth Admin API and `email_confirm: true`, so that account can sign in without waiting for a confirmation message. `handle_new_user` still inserts `public.profiles` and `public.user_roles` as `customer`. The admin role is applied afterward with the service role on `public.user_roles` only. Do not store the role in `user_metadata`.

The one-time password is not stored in this repository. Sign in at `http://localhost:3000/admin` and change the password after the first login (Supabase Dashboard → Authentication → Users).

To promote a different confirmed account later, copy its id from Authentication → Users and run:

```sql
UPDATE public.user_roles
SET role = 'admin'
WHERE user_id = '00000000-0000-0000-0000-000000000000';
```

Replace the placeholder uuid with that id.

## Enable Supabase Auth email confirmation

Confirm email stays on. Normal signup at `/account/signup` does not open `/account` until the address is confirmed; the page keeps the Arabic notice that a confirmation email was sent. The Management API could not be called from this environment (no access token), so the setting was not changed here. The public Auth settings endpoint reports `mailer_autoconfirm` as false, which means Confirm email is already enabled.

Check or turn it on in the dashboard:

1. Open `https://supabase.com/dashboard/project/sfvcbdoxoemxzislrnfs/auth/providers`
2. Authentication → Sign In / Providers → Email
3. Leave **Confirm email** on

Do not turn Confirm email off to make the admin sign-in easier. The admin account was confirmed through the Admin API only.

## Google OAuth

1. Google Cloud → OAuth client (Web).
   - Authorized redirect URI: `https://sfvcbdoxoemxzislrnfs.supabase.co/auth/v1/callback`
   - Authorized JavaScript origin: `http://localhost:3000`
2. Supabase Dashboard → Authentication → URL configuration.
   - Site URL: `http://localhost:3000`
   - Redirect allow list: `http://localhost:3000/auth/callback`
3. Supabase → Authentication → Providers → Google: paste the Client ID and Client Secret in the dashboard only.

## Vercel Deploy

```bash
vercel --prod
```

Set all env vars in Vercel project settings.

## Production Checklist

- [ ] Rotate Supabase DB password and access token
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` in Vercel (server-only)
- [x] Enable Supabase Auth email confirmation (on — Authentication → Sign In / Providers → Email → Confirm email)
- [ ] Configure Google OAuth in Supabase dashboard
- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Configure R2 bucket + CDN domain (or use placeholder images)
- [ ] Verify Resend domain and set `RESEND_FROM_EMAIL`
- [ ] Set `ADMIN_NOTIFICATION_EMAIL`
- [ ] Configure WhatsApp number in admin settings
- [ ] Set per-governorate shipping rates in admin
- [ ] Run `npm run build` — must pass
- [ ] Run `npm test` — business logic tests pass
- [ ] Verify `/sitemap.xml` and `/robots.txt`
- [ ] Test guest checkout end-to-end
- [ ] Test admin order queue realtime
- [ ] Enable Vercel Analytics (optional)

## Image CDN (Cloudflare R2)

1. Cloudflare Dashboard → R2 → create a bucket.
2. Manage R2 API tokens → create a token with Object Read & Write on that bucket. Copy Account ID, Access Key ID, Secret Access Key (dashboard only).
3. Enable a public r2.dev subdomain or attach a custom domain. That origin is `R2_PUBLIC_URL` (no trailing slash).
4. Set in `.env.local` and Vercel (server-only except `R2_PUBLIC_URL`): `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`.
5. Allow that host in `next.config.ts` `images.remotePatterns` (implementation reads `R2_PUBLIC_URL`).
6. Restart `next dev`. Until all five are set, admin forms show **رفع الصور غير مُعد**.

## Resend

1. Resend → Domains → add and verify the sending domain (DNS).
2. Create an API key in the dashboard only.
3. Set `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (from that domain), `ADMIN_NOTIFICATION_EMAIL` in `.env.local` and Vercel.
4. Until those are set, orders still create; logs show `email.not-configured`.

## Monitoring

Structured logs via `lib/logging`. Consider Vercel Log Drain or Supabase logs for production.
