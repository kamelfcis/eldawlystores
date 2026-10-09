import { Resend } from "resend";
import { log, logWarn } from "@/lib/logging";

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
}

export type EmailResult =
  | { status: "sent"; id: string }
  | { status: "not-configured" }
  | { status: "skipped"; reason: string }
  | { status: "failed"; error: string };

export interface OrderEmailLine {
  productName: string;
  quantity: number;
  lineTotalFormatted: string;
}

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalFormatted: string;
  status?: string;
  lines?: OrderEmailLine[];
}

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

function renderLineItems(lines: OrderEmailLine[] | undefined): string {
  if (!lines?.length) return "";
  const items = lines
    .map((line) => {
      const quantity = Number.isFinite(line.quantity) ? Math.trunc(line.quantity) : 0;
      return `<li>${escapeHtml(line.productName)} — الكمية ${quantity} — ${escapeHtml(line.lineTotalFormatted)}</li>`;
    })
    .join("");
  return `<ul>${items}</ul>`;
}

export function buildOrderEmailHtml(
  template: EmailTemplate,
  data: Omit<OrderEmailData, "customerEmail">
): EmailPayload {
  const subjects: Record<EmailTemplate, string> = {
    "new-order-admin": `طلب جديد #${data.orderNumber}`,
    "order-confirmed-customer": `تأكيد طلبك #${data.orderNumber}`,
    "order-shipped": `تم شحن طلبك #${data.orderNumber}`,
    "order-delivered": `تم تسليم طلبك #${data.orderNumber}`,
    "order-cancelled": `تم إلغاء طلبك #${data.orderNumber}`,
  };

  const body = `<div dir="rtl" style="font-family: sans-serif;">
    <h2>${escapeHtml(subjects[template])}</h2>
    <p>مرحباً ${escapeHtml(data.customerName)}،</p>
    <p>رقم الطلب: ${escapeHtml(data.orderNumber)}</p>
    ${renderLineItems(data.lines)}
    <p>إجمالي الطلب: ${escapeHtml(data.totalFormatted)}</p>
    ${data.status ? `<p>الحالة: ${escapeHtml(data.status)}</p>` : ""}
    <p>شكراً لتسوقك من Doly Stores</p>
  </div>`;

  const to = template === "new-order-admin" ? "" : data.customerName;

  return { to, subject: subjects[template], html: body };
}

function summarizeResults(results: EmailResult[]): EmailResult {
  const failed = results.find((result) => result.status === "failed");
  if (failed) return failed;
  const notConfigured = results.find((result) => result.status === "not-configured");
  if (notConfigured) return notConfigured;
  return results[results.length - 1] ?? { status: "not-configured" };
}

export async function sendOrderEmail(
  template: EmailTemplate,
  data: OrderEmailData
): Promise<EmailResult> {
  const payload = buildOrderEmailHtml(template, data);
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
