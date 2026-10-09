# Doly Stores — Email Templates

## Provider

Resend via `lib/email`. When `RESEND_API_KEY` is unset, emails return `{ status: 'not-configured' }` and are logged — never faked as delivered.

## Templates

| Template ID | Trigger | Recipient |
|-------------|---------|-----------|
| `new-order-admin` | Order created | Each distinct address in `ADMIN_NOTIFICATION_EMAIL` (one send per address) |
| `order-confirmed-customer` | Order created | Customer |
| `order-shipped` | Status → shipped | Customer |
| `order-delivered` | Status → delivered | Customer |
| `order-cancelled` | Status → cancelled/rejected | Customer |

## Configuration

```env
RESEND_API_KEY=
RESEND_FROM_EMAIL=orders@yourdomain.com
ADMIN_NOTIFICATION_EMAIL=admin@yourdomain.com,owner@yourdomain.com
```

`ADMIN_NOTIFICATION_EMAIL` is comma-separated. Blank entries are ignored, and a repeated address is sent once. These placeholders are not real inboxes.

The customer confirmation subject stays `تأكيد طلبك #[orderNumber]`. Its Arabic body includes the customer name, order number, each saved line (product name, quantity, and line total), and the order total from `formatMoney`. Names and product text are HTML-escaped. Status emails (`order-shipped`, `order-delivered`, `order-cancelled`) stay addressed to the customer only. Moving an order to `confirmed` does not send a second customer email.

## Arabic Content

All customer-facing emails are Arabic-first with order details, status, and Doly Stores branding.

## Wiring

- Checkout success → `new-order-admin` + `order-confirmed-customer`
- Admin status change → appropriate status email
