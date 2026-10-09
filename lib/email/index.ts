import { Resend } from "resend";
import { log, logWarn } from "@/lib/logging";
import { getPublicUrl } from "@/lib/storage";
import { getStorefrontBranding } from "@/lib/store-settings";

export type EmailTemplate =
  | "new-order-admin"
  | "order-confirmed-customer"
  | "order-shipped"
  | "order-delivered"
  | "order-cancelled";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
  reply_to: string;
}

const ORDER_REPLY_TO = "sales@eldawlystores.shop";
const RECEIPT_FONT = "Tahoma, 'Segoe UI', sans-serif";
const RECEIPT_TEMPLATES = new Set<EmailTemplate>(["new-order-admin", "order-confirmed-customer"]);
const EMAIL_LOGO_FALLBACK = "https://eldawlystores.vercel.app/branding/doly-wordmark.svg";

export type EmailResult =
  | { status: "sent"; id: string }
  | { status: "not-configured" }
  | { status: "skipped"; reason: string }
  | { status: "failed"; error: string };

export interface OrderEmailAddress {
  governorate?: string;
  city?: string;
  street?: string;
  building?: string;
  floor?: string;
}

export interface OrderEmailLine {
  productName: string;
  sku?: string;
  quantity: number;
  unitPriceFormatted?: string;
  lineTotalFormatted: string;
  imageUrl?: string | null;
}

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress?: OrderEmailAddress;
  paymentMethod?: string;
  subtotalFormatted?: string;
  shippingFormatted?: string;
  discountFormatted?: string;
  totalFormatted: string;
  status?: string;
  lines?: OrderEmailLine[];
}

type OrderEmailContent = Omit<OrderEmailData, "customerEmail"> & { customerEmail?: string };

const STATUS_LABELS: Record<string, string> = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "تم الإلغاء",
  rejected: "مرفوض",
};

function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

export function parseAdminNotificationEmails(value: string | undefined): string[] {
  if (!value) return [];
  const seen = new Set<string>();
  const emails: string[] = [];
  for (const part of value.split(",")) {
    const email = part.trim();
    if (!email) continue;
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    emails.push(email);
  }
  return emails;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isBareObjectKey(value: string): boolean {
  if (value.startsWith("/") || value.startsWith("./") || value.startsWith("../")) return false;
  if (value.includes("\\") || value.includes(":") || /\s/.test(value)) return false;
  return /^[A-Za-z0-9][A-Za-z0-9/_\-.]*$/.test(value);
}

/** Absolute http(s) URLs pass through. Bare keys use getPublicUrl only when that result is https. */
export function resolveEmailImageUrl(stored: string | null | undefined): string | undefined {
  const value = stored?.trim() ?? "";
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  if (!isBareObjectKey(value)) return undefined;
  const publicUrl = getPublicUrl(value);
  if (publicUrl?.startsWith("https://")) return publicUrl;
  return undefined;
}

function httpImageUrl(stored: string | null | undefined): string | undefined {
  const value = stored?.trim() ?? "";
  if (/^https?:\/\//i.test(value)) return value;
  return undefined;
}

/** Absolute http(s) logo URLs pass through. Relative values use the production wordmark. */
export function resolveEmailLogoUrl(logoUrl: string | null | undefined): string {
  const value = logoUrl?.trim() ?? "";
  if (/^https?:\/\//i.test(value)) return value;
  return EMAIL_LOGO_FALLBACK;
}

export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  if (!isResendConfigured()) {
    logWarn("email.not-configured", { to: payload.to, subject: payload.subject });
    return { status: "not-configured" };
  }

  try {
    const resend = getResendClient()!;
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      replyTo: payload.reply_to,
    });

    if (result.error) {
      logWarn("email.failed", { error: result.error.message });
      return { status: "failed", error: result.error.message };
    }

    log("email.sent", { id: result.data?.id ?? "unknown" });
    return { status: "sent", id: result.data?.id ?? "unknown" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logWarn("email.failed", { error: message });
    return { status: "failed", error: message };
  }
}

function lineQuantity(line: OrderEmailLine): number {
  return Number.isFinite(line.quantity) ? Math.trunc(line.quantity) : 0;
}

function paymentLabel(method: string): string {
  if (method === "cod") return "الدفع عند الاستلام";
  return method;
}

function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function formatShippingAddress(address: OrderEmailAddress | undefined): string {
  if (!address) return "";
  const parts = [address.governorate, address.city, address.street]
    .map((part) => part?.trim() ?? "")
    .filter((part) => part.length > 0);
  const building = address.building?.trim() ?? "";
  const floor = address.floor?.trim() ?? "";
  if (building) parts.push(building);
  if (floor) parts.push(floor);
  return parts.join("، ");
}

function renderLineItems(lines: OrderEmailLine[] | undefined): string {
  if (!lines?.length) return "";
  const items = lines
    .map(
      (line) =>
        `<li>${escapeHtml(line.productName)} — الكمية ${lineQuantity(line)} — ${escapeHtml(line.lineTotalFormatted)}</li>`
    )
    .join("");
  return `<ul>${items}</ul>`;
}

function renderPlainLines(lines: OrderEmailLine[] | undefined): string {
  if (!lines?.length) return "";
  return lines
    .map((line) => {
      const parts = [line.productName];
      const sku = line.sku?.trim() ?? "";
      if (sku) parts.push(sku);
      parts.push(`الكمية ${lineQuantity(line)}`);
      if (line.unitPriceFormatted) parts.push(line.unitPriceFormatted);
      parts.push(line.lineTotalFormatted);
      const image = httpImageUrl(line.imageUrl);
      if (image) parts.push(image);
      return parts.join(" — ");
    })
    .join("\n");
}

function spanRow(value: string): string {
  if (!value) return "";
  return `<tr>
    <td colspan="2" valign="top" bgcolor="#ffffff" style="padding:7px 0;font-family:${RECEIPT_FONT};font-size:14px;line-height:1.5;color:#1c1614;background-color:#ffffff;">${escapeHtml(value)}</td>
  </tr>`;
}

function detailRow(label: string, value: string): string {
  if (!value) return "";
  return `<tr>
    <td width="128" valign="top" bgcolor="#ffffff" style="width:128px;padding:7px 0;font-family:${RECEIPT_FONT};font-size:13px;line-height:1.5;color:#6b5e56;background-color:#ffffff;">${escapeHtml(label)}</td>
    <td valign="top" bgcolor="#ffffff" style="padding:7px 0;font-family:${RECEIPT_FONT};font-size:14px;line-height:1.5;color:#1c1614;background-color:#ffffff;">${escapeHtml(value)}</td>
  </tr>`;
}

function imageCell(line: OrderEmailLine): string {
  const src = httpImageUrl(line.imageUrl);
  const inner = src
    ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(line.productName)}" width="64" height="64" style="display:block;width:64px;height:64px;border:0;outline:none;text-decoration:none;" />`
    : "&nbsp;";
  return `<td width="72" height="72" align="center" valign="middle" bgcolor="#f6f1ec" style="width:72px;height:72px;padding:4px;background-color:#f6f1ec;border-bottom:1px solid #e6ddd4;">${inner}</td>`;
}

function lineCell(value: string, width: number | null, align: "right" | "center"): string {
  const widthAttr = width ? ` width="${width}"` : "";
  const widthStyle = width ? `width:${width}px;` : "";
  return `<td${widthAttr} valign="middle" align="${align}" bgcolor="#ffffff" style="${widthStyle}padding:10px 8px;font-family:${RECEIPT_FONT};font-size:13px;line-height:1.5;color:#1c1614;background-color:#ffffff;border-bottom:1px solid #e6ddd4;">${value}</td>`;
}

function renderReceiptLines(lines: OrderEmailLine[] | undefined): string {
  if (!lines?.length) return "";
  const header = `<tr>
    <td width="72" bgcolor="#f6efe6" style="width:72px;padding:8px;font-family:${RECEIPT_FONT};font-size:12px;font-weight:bold;color:#1c1614;background-color:#f6efe6;border-bottom:1px solid #e6ddd4;">صورة</td>
    <td bgcolor="#f6efe6" style="padding:8px;font-family:${RECEIPT_FONT};font-size:12px;font-weight:bold;color:#1c1614;background-color:#f6efe6;border-bottom:1px solid #e6ddd4;">المنتج</td>
    <td width="88" bgcolor="#f6efe6" style="width:88px;padding:8px;font-family:${RECEIPT_FONT};font-size:12px;font-weight:bold;color:#1c1614;background-color:#f6efe6;border-bottom:1px solid #e6ddd4;">الرمز</td>
    <td width="88" align="center" bgcolor="#f6efe6" style="width:88px;padding:8px;font-family:${RECEIPT_FONT};font-size:12px;font-weight:bold;color:#1c1614;background-color:#f6efe6;border-bottom:1px solid #e6ddd4;">الكمية</td>
    <td width="96" bgcolor="#f6efe6" style="width:96px;padding:8px;font-family:${RECEIPT_FONT};font-size:12px;font-weight:bold;color:#1c1614;background-color:#f6efe6;border-bottom:1px solid #e6ddd4;">سعر الوحدة</td>
    <td width="96" bgcolor="#f6efe6" style="width:96px;padding:8px;font-family:${RECEIPT_FONT};font-size:12px;font-weight:bold;color:#1c1614;background-color:#f6efe6;border-bottom:1px solid #e6ddd4;">الإجمالي</td>
  </tr>`;
  const rows = lines
    .map((line) => {
      const quantity = lineQuantity(line);
      return `<tr>
        ${imageCell(line)}
        ${lineCell(escapeHtml(line.productName), null, "right")}
        ${lineCell(escapeHtml(line.sku?.trim() ?? ""), 88, "right")}
        ${lineCell(`الكمية ${quantity}`, 88, "center")}
        ${lineCell(escapeHtml(line.unitPriceFormatted ?? ""), 96, "right")}
        ${lineCell(escapeHtml(line.lineTotalFormatted), 96, "right")}
      </tr>`;
    })
    .join("");
  return `<tr>
    <td style="padding:8px 24px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="width:100%;border-collapse:collapse;background-color:#ffffff;">
        ${header}
        ${rows}
      </table>
    </td>
  </tr>`;
}

function totalRow(label: string, value: string, emphasis: boolean): string {
  if (!value) return "";
  const color = emphasis ? "#a92222" : "#1c1614";
  const weight = emphasis ? "bold" : "normal";
  const bg = emphasis ? "#faf6f2" : "#ffffff";
  return `<tr>
    <td bgcolor="${bg}" style="padding:7px 0;font-family:${RECEIPT_FONT};font-size:14px;font-weight:${weight};color:${color};background-color:${bg};">${escapeHtml(label)}</td>
    <td align="left" bgcolor="${bg}" style="padding:7px 0;font-family:${RECEIPT_FONT};font-size:14px;font-weight:${weight};color:${color};background-color:${bg};">${escapeHtml(value)}</td>
  </tr>`;
}

function renderReceiptHtml(subject: string, data: OrderEmailContent, logoUrl: string | null | undefined): string {
  const address = formatShippingAddress(data.shippingAddress);
  const payment = data.paymentMethod?.trim() ? paymentLabel(data.paymentMethod.trim()) : "";
  const status = data.status?.trim() ? statusLabel(data.status.trim()) : "";
  const logoSrc = escapeHtml(resolveEmailLogoUrl(logoUrl));
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<body bgcolor="#f3eee6" style="margin:0;padding:0;background-color:#f3eee6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f3eee6" dir="rtl" style="width:100%;background-color:#f3eee6;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" dir="rtl" style="width:600px;max-width:600px;background-color:#ffffff;">
          <tr>
            <td bgcolor="#1a211e" style="padding:22px 24px;font-family:${RECEIPT_FONT};background-color:#1a211e;">
              <img src="${logoSrc}" alt="Doly Stores" width="148" border="0" style="display:block;width:148px;height:auto;max-height:40px;border:0;outline:none;text-decoration:none;" />
              <div style="font-family:${RECEIPT_FONT};font-size:22px;line-height:1.3;font-weight:bold;color:#ffffff;">Doly Stores</div>
              <div style="font-family:${RECEIPT_FONT};font-size:15px;line-height:1.5;color:#ffffff;padding-top:6px;">${escapeHtml(subject)}</div>
            </td>
          </tr>
          <tr>
            <td bgcolor="#a92222" height="4" style="height:4px;font-size:0;line-height:0;background-color:#a92222;">&nbsp;</td>
          </tr>
          <tr>
            <td bgcolor="#ffffff" style="padding:20px 24px 0;font-family:${RECEIPT_FONT};font-size:15px;line-height:1.6;color:#1c1614;background-color:#ffffff;">مرحباً ${escapeHtml(data.customerName)}،</td>
          </tr>
          <tr>
            <td style="padding:12px 24px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="width:100%;background-color:#ffffff;">
                ${detailRow("الاسم", data.customerName)}
                ${detailRow("البريد", data.customerEmail ?? "")}
                ${detailRow("الهاتف", data.customerPhone?.trim() ?? "")}
                ${detailRow("العنوان", address)}
                ${spanRow(`رقم الطلب: ${data.orderNumber}`)}
                ${detailRow("الدفع", payment)}
                ${detailRow("الحالة", status)}
              </table>
            </td>
          </tr>
          ${renderReceiptLines(data.lines)}
          <tr>
            <td style="padding:16px 24px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="width:100%;background-color:#ffffff;">
                ${totalRow("المجموع الفرعي", data.subtotalFormatted ?? "", false)}
                ${totalRow("الشحن", data.shippingFormatted ?? "", false)}
                ${totalRow("الخصم", data.discountFormatted ?? "", false)}
                ${totalRow("إجمالي الطلب", data.totalFormatted, true)}
              </table>
            </td>
          </tr>
          <tr>
            <td bgcolor="#faf6f2" style="padding:16px 24px 20px;font-family:${RECEIPT_FONT};font-size:13px;line-height:1.6;color:#6b5e56;background-color:#faf6f2;">شكراً لتسوقك من Doly Stores</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderReceiptText(subject: string, data: OrderEmailContent): string {
  const address = formatShippingAddress(data.shippingAddress);
  const payment = data.paymentMethod?.trim() ? paymentLabel(data.paymentMethod.trim()) : "";
  const status = data.status?.trim() ? statusLabel(data.status.trim()) : "";
  return [
    subject,
    "Doly Stores",
    `مرحباً ${data.customerName}،`,
    data.customerEmail ? `البريد: ${data.customerEmail}` : "",
    data.customerPhone?.trim() ? `الهاتف: ${data.customerPhone.trim()}` : "",
    address ? `العنوان: ${address}` : "",
    `رقم الطلب: ${data.orderNumber}`,
    payment ? `الدفع: ${payment}` : "",
    status ? `الحالة: ${status}` : "",
    renderPlainLines(data.lines),
    data.subtotalFormatted ? `المجموع الفرعي: ${data.subtotalFormatted}` : "",
    data.shippingFormatted ? `الشحن: ${data.shippingFormatted}` : "",
    data.discountFormatted ? `الخصم: ${data.discountFormatted}` : "",
    `إجمالي الطلب: ${data.totalFormatted}`,
    "شكراً لتسوقك من Doly Stores",
  ]
    .filter((part) => part.length > 0)
    .join("\n");
}

function renderNoticeHtml(subject: string, data: OrderEmailContent): string {
  return `<div dir="rtl" lang="ar" style="font-family:${RECEIPT_FONT};">
    <h2>${escapeHtml(subject)}</h2>
    <p>مرحباً ${escapeHtml(data.customerName)}،</p>
    <p>رقم الطلب: ${escapeHtml(data.orderNumber)}</p>
    ${renderLineItems(data.lines)}
    <p>إجمالي الطلب: ${escapeHtml(data.totalFormatted)}</p>
    ${data.status ? `<p>الحالة: ${escapeHtml(data.status)}</p>` : ""}
    <p>شكراً لتسوقك من Doly Stores</p>
  </div>`;
}

function renderNoticeText(subject: string, data: OrderEmailContent): string {
  const plainLines = renderPlainLines(data.lines);
  return [
    subject,
    `مرحباً ${data.customerName}،`,
    `رقم الطلب: ${data.orderNumber}`,
    plainLines,
    `إجمالي الطلب: ${data.totalFormatted}`,
    data.status ? `الحالة: ${data.status}` : "",
    "شكراً لتسوقك من Doly Stores",
  ]
    .filter((part) => part.length > 0)
    .join("\n");
}

export function buildOrderEmailHtml(
  template: EmailTemplate,
  data: OrderEmailContent,
  logoUrl?: string | null
): EmailPayload {
  const subjects: Record<EmailTemplate, string> = {
    "new-order-admin": `طلب جديد #${data.orderNumber}`,
    "order-confirmed-customer": `تأكيد طلبك #${data.orderNumber}`,
    "order-shipped": `تم شحن طلبك #${data.orderNumber}`,
    "order-delivered": `تم تسليم طلبك #${data.orderNumber}`,
    "order-cancelled": `تم إلغاء طلبك #${data.orderNumber}`,
  };
  const subject = subjects[template];
  const receipt = RECEIPT_TEMPLATES.has(template);

  return {
    to: template === "new-order-admin" ? "" : data.customerName,
    subject,
    html: receipt ? renderReceiptHtml(subject, data, logoUrl) : renderNoticeHtml(subject, data),
    text: receipt ? renderReceiptText(subject, data) : renderNoticeText(subject, data),
    reply_to: ORDER_REPLY_TO,
  };
}

function summarizeResults(results: EmailResult[]): EmailResult {
  const failed = results.find((result) => result.status === "failed");
  if (failed) return failed;
  const notConfigured = results.find((result) => result.status === "not-configured");
  if (notConfigured) return notConfigured;
  return results[results.length - 1] ?? { status: "not-configured" };
}

async function readEmailLogoUrl(template: EmailTemplate): Promise<string | undefined> {
  if (!RECEIPT_TEMPLATES.has(template)) return undefined;
  try {
    const branding = await getStorefrontBranding();
    return branding.logoUrl;
  } catch {
    return undefined;
  }
}

export async function sendOrderEmail(
  template: EmailTemplate,
  data: OrderEmailData
): Promise<EmailResult> {
  const payload = buildOrderEmailHtml(template, data, await readEmailLogoUrl(template));
  if (template === "new-order-admin") {
    const admins = parseAdminNotificationEmails(process.env.ADMIN_NOTIFICATION_EMAIL);
    if (admins.length === 0) {
      logWarn("email.not-configured", { template: "new-order-admin" });
      return { status: "not-configured" };
    }
    const results: EmailResult[] = [];
    for (const admin of admins) {
      results.push(await sendEmail({ ...payload, to: admin }));
    }
    return summarizeResults(results);
  }

  payload.to = data.customerEmail;
  return sendEmail(payload);
}
