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

function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
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

export function buildOrderEmailHtml(
  template: EmailTemplate,
  data: { orderNumber: string; customerName: string; totalFormatted: string; status?: string }
): EmailPayload {
  const subjects: Record<EmailTemplate, string> = {
    "new-order-admin": `طلب جديد #${data.orderNumber}`,
    "order-confirmed-customer": `تأكيد طلبك #${data.orderNumber}`,
    "order-shipped": `تم شحن طلبك #${data.orderNumber}`,
    "order-delivered": `تم تسليم طلبك #${data.orderNumber}`,
    "order-cancelled": `تم إلغاء طلبك #${data.orderNumber}`,
  };

  const body = `<div dir="rtl" style="font-family: sans-serif;">
    <h2>${subjects[template]}</h2>
    <p>مرحباً ${data.customerName}،</p>
    <p>إجمالي الطلب: ${data.totalFormatted}</p>
    ${data.status ? `<p>الحالة: ${data.status}</p>` : ""}
    <p>شكراً لتسوقك من Doly Stores</p>
  </div>`;

  const to = template === "new-order-admin" ? "" : data.customerName;

  return { to, subject: subjects[template], html: body };
}

export async function sendOrderEmail(
  template: EmailTemplate,
  data: { orderNumber: string; customerName: string; customerEmail: string; totalFormatted: string; status?: string }
): Promise<EmailResult> {
  const payload = buildOrderEmailHtml(template, data);
  if (template === "new-order-admin") {
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    if (!adminEmail) {
      logWarn("email.not-configured", { template: "new-order-admin" });
      return { status: "not-configured" };
    }
    payload.to = adminEmail;
  } else {
    payload.to = data.customerEmail;
  }
  return sendEmail(payload);
}
