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

The customer confirmation subject stays `تأكيد طلبك #[orderNumber]`. The admin subject stays `طلب جديد #[orderNumber]`. `reply_to` stays `sales@eldawlystores.shop`.

`new-order-admin` and `order-confirmed-customer` are Arabic receipt tables (`dir="rtl"`, `lang="ar"`, about 600px, Tahoma / Segoe UI, retail red `#a92222` on paper white). They include the saved customer name, email, phone, and shipping address (`governorate`, `city`, `street`, plus `building` and `floor` only when those were saved), the order number, payment (`cod` shown as الدفع عند الاستلام), and status (`pending` shown as قيد الانتظار). Each saved line shows an image, name, SKU, quantity, unit price, and line total. The totals are the stored subtotal, shipping, discount, and total, each passed through `formatMoney` from integer piasters. The plain-text part lists the same facts.

A line image is included only when the URL is absolute `http` or `https`. `order_items` has no image column. At send time the image is resolved from `variant_id` to `product_id` to the first `product_images` row by `sort_order`. A bare object key is passed to `getPublicUrl` and used only when that result is `https`. Relative paths, including `/placeholder-product.svg`, are omitted, and the site origin is not prefixed. `img` `src` and `alt`, and every other interpolated value, are HTML-escaped.

Status emails (`order-shipped`, `order-delivered`, `order-cancelled`) stay the shorter Arabic notice and stay addressed to the customer only. They do not include status-history notes. Moving an order to `confirmed` does not send a second customer email. A failed email does not fail checkout.

## Arabic Content

All customer-facing emails are Arabic-first with order details, status, and Doly Stores branding.

## Wiring

- Checkout success → `new-order-admin` + `order-confirmed-customer`
- Admin status change → appropriate status email
