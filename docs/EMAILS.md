# Doly Stores — Email Templates

## Provider

Resend via `lib/email`. When `RESEND_API_KEY` is unset, emails return `{ status: 'not-configured' }` and are logged — never faked as delivered.

## Templates

| Template ID | Trigger | Recipient |
|-------------|---------|-----------|
| `new-order-admin` | Order created | Admin notification email |
| `order-confirmed-customer` | Order created | Customer |
| `order-shipped` | Status → shipped | Customer |
| `order-delivered` | Status → delivered | Customer |
| `order-cancelled` | Status → cancelled/rejected | Customer |

## Configuration

```env
RESEND_API_KEY=
RESEND_FROM_EMAIL=orders@yourdomain.com
ADMIN_NOTIFICATION_EMAIL=admin@yourdomain.com
```

## Arabic Content

All customer-facing emails are Arabic-first with order details, status, and Doly Stores branding.

## Wiring

- Checkout success → `new-order-admin` + `order-confirmed-customer`
- Admin status change → appropriate status email
