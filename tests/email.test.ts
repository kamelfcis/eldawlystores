import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatMoney } from "@/lib/money";

type SendResult = {
  data: { id: string } | null;
  error: { message: string } | null;
};

const { sendMock } = vi.hoisted(() => ({
  sendMock: vi.fn(
    async (_payload: { from: string; to: string; subject: string; html: string }): Promise<SendResult> => ({
      data: { id: "email_test" },
      error: null,
    })
  ),
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

import { buildOrderEmailHtml, parseAdminNotificationEmails, sendOrderEmail } from "@/lib/email";

const orderMail = {
  orderNumber: "DOLY-1",
  customerName: "أحمد",
  customerEmail: "shopper@example.com",
  totalFormatted: formatMoney(150000),
};

describe("parseAdminNotificationEmails", () => {
  it("trims, drops empties, and keeps the first of each distinct address", () => {
    expect(
      parseAdminNotificationEmails(" one@example.com, ,two@example.com, ONE@example.com ")
    ).toEqual(["one@example.com", "two@example.com"]);
  });

  it("returns no addresses when the value is blank", () => {
    expect(parseAdminNotificationEmails(undefined)).toEqual([]);
    expect(parseAdminNotificationEmails(" , ")).toEqual([]);
  });
});

describe("sendOrderEmail", () => {
  const previousAdmin = process.env.ADMIN_NOTIFICATION_EMAIL;
  const previousKey = process.env.RESEND_API_KEY;
  const previousFrom = process.env.RESEND_FROM_EMAIL;

  beforeEach(() => {
    sendMock.mockClear();
    sendMock.mockResolvedValue({ data: { id: "email_test" }, error: null });
    process.env.RESEND_API_KEY = "test-key";
    process.env.RESEND_FROM_EMAIL = "sales@example.com";
  });

  afterEach(() => {
    if (previousAdmin === undefined) delete process.env.ADMIN_NOTIFICATION_EMAIL;
    else process.env.ADMIN_NOTIFICATION_EMAIL = previousAdmin;
    if (previousKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousKey;
    if (previousFrom === undefined) delete process.env.RESEND_FROM_EMAIL;
    else process.env.RESEND_FROM_EMAIL = previousFrom;
  });

  it("sends new-order-admin once to each distinct admin", async () => {
    process.env.ADMIN_NOTIFICATION_EMAIL = "one@example.com, two@example.com";
    const result = await sendOrderEmail("new-order-admin", orderMail);
    expect(result.status).toBe("sent");
    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(sendMock.mock.calls.map((call) => call[0]?.to)).toEqual([
      "one@example.com",
      "two@example.com",
    ]);
    expect(sendMock.mock.calls[0]?.[0]?.subject).toBe("طلب جديد #DOLY-1");
  });

  it("sends a repeated admin address once", async () => {
    process.env.ADMIN_NOTIFICATION_EMAIL = "one@example.com, one@example.com, ONE@example.com";
    await sendOrderEmail("new-order-admin", orderMail);
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock.mock.calls[0]?.[0]?.to).toBe("one@example.com");
  });

  it("keeps shipped, delivered, and cancelled mail on the customer address", async () => {
    process.env.ADMIN_NOTIFICATION_EMAIL = "one@example.com, two@example.com";
    for (const template of ["order-shipped", "order-delivered", "order-cancelled"] as const) {
      sendMock.mockClear();
      await sendOrderEmail(template, { ...orderMail, status: template });
      expect(sendMock).toHaveBeenCalledTimes(1);
      expect(sendMock.mock.calls[0]?.[0]?.to).toBe("shopper@example.com");
    }
  });

  it("does not report a failed admin send as sent", async () => {
    process.env.ADMIN_NOTIFICATION_EMAIL = "one@example.com, two@example.com";
    sendMock
      .mockResolvedValueOnce({ data: null, error: { message: "rejected" } })
      .mockResolvedValueOnce({ data: { id: "email_ok" }, error: null });
    const result = await sendOrderEmail("new-order-admin", orderMail);
    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ status: "failed", error: "rejected" });
  });
});

describe("customer confirmation html", () => {
  it("includes the formatted total and escaped product text", () => {
    const totalFormatted = formatMoney(250000);
    const lineTotalFormatted = formatMoney(200000);
    const payload = buildOrderEmailHtml("order-confirmed-customer", {
      orderNumber: "DOLY-9",
      customerName: "أحمد <script>",
      totalFormatted,
      lines: [{ productName: `هاتف & "جديد"`, quantity: 2, lineTotalFormatted }],
    });

    expect(payload.subject).toBe("تأكيد طلبك #DOLY-9");
    expect(payload.html).toContain('dir="rtl"');
    expect(payload.html).toContain("رقم الطلب: DOLY-9");
    expect(payload.html).toContain(totalFormatted);
    expect(payload.html).toContain(lineTotalFormatted);
    expect(payload.html).toContain("الكمية 2");
    expect(payload.html).toContain("&lt;script&gt;");
    expect(payload.html).toContain("هاتف &amp; &quot;جديد&quot;");
    expect(payload.html).not.toContain("<script>");
  });
});
