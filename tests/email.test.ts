import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatMoney } from "@/lib/money";

type SendResult = {
  data: { id: string } | null;
  error: { message: string } | null;
};

const { sendMock, brandingMock } = vi.hoisted(() => ({
  sendMock: vi.fn(
    async (_payload: {
      from: string;
      to: string;
      subject: string;
      html: string;
      text: string;
      replyTo: string;
    }): Promise<SendResult> => ({
      data: { id: "email_test" },
      error: null,
    })
  ),
  brandingMock: vi.fn(async () => ({ logoUrl: "" })),
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

vi.mock("@/lib/store-settings", () => ({
  getStorefrontBranding: brandingMock,
}));

import {
  buildOrderEmailHtml,
  parseAdminNotificationEmails,
  resolveEmailImageUrl,
  resolveEmailLogoUrl,
  sendOrderEmail,
} from "@/lib/email";

const EMAIL_LOGO_FALLBACK = "https://eldawlystores.vercel.app/branding/doly-wordmark.svg";

function extractRows(html: string): string[] {
  const rows: string[] = [];
  const token = /<\/?tr\b[^>]*>/gi;
  const stack: number[] = [];
  let match: RegExpExecArray | null;
  while ((match = token.exec(html))) {
    if (/^<tr\b/i.test(match[0])) {
      stack.push(match.index);
    } else if (stack.length) {
      const start = stack.pop()!;
      rows.push(html.slice(start, match.index + match[0].length));
    }
  }
  return rows;
}

function leafRows(html: string): string[] {
  return extractRows(html).filter((row) => !row.slice(3).includes("<tr"));
}

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
    brandingMock.mockReset();
    brandingMock.mockResolvedValue({ logoUrl: "" });
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
    expect(sendMock.mock.calls[0]?.[0]?.replyTo).toBe("sales@eldawlystores.shop");
    expect(sendMock.mock.calls[0]?.[0]?.text).toContain("طلب جديد #DOLY-1");
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

  it("sends the customer confirmation with plain text and reply-to", async () => {
    const result = await sendOrderEmail("order-confirmed-customer", orderMail);
    expect(result.status).toBe("sent");
    expect(sendMock).toHaveBeenCalledTimes(1);
    const sent = sendMock.mock.calls[0]?.[0];
    expect(sent?.to).toBe("shopper@example.com");
    expect(sent?.subject).toBe("تأكيد طلبك #DOLY-1");
    expect(sent?.html).toContain('dir="rtl"');
    expect(sent?.text).toContain("تأكيد طلبك #DOLY-1");
    expect(sent?.text).toContain(orderMail.totalFormatted);
    expect(sent?.replyTo).toBe("sales@eldawlystores.shop");
    expect(sent?.html).toContain("<table");
    expect(sent?.html).toContain(orderMail.totalFormatted);
  });

  it("puts the customer phone in the admin receipt table", async () => {
    process.env.ADMIN_NOTIFICATION_EMAIL = "one@example.com";
    await sendOrderEmail("new-order-admin", {
      ...orderMail,
      customerPhone: "01012345678",
    });
    const html = sendMock.mock.calls[0]?.[0]?.html as string;
    expect(html).toContain("01012345678");
    expect(html).toContain("<table");
    expect(html).toContain("#a92222");
    expect(html).toContain('lang="ar"');
  });

  it("puts the absolute store logo on the carbon receipt header", async () => {
    brandingMock.mockResolvedValue({ logoUrl: "https://cdn.example/wordmark.svg" });
    await sendOrderEmail("order-confirmed-customer", orderMail);
    const html = sendMock.mock.calls[0]?.[0]?.html as string;
    expect(html).toContain("#1a211e");
    expect(html).toContain('src="https://cdn.example/wordmark.svg"');
    expect(html).toContain('alt="Doly Stores"');
    expect(html).toContain('width="148"');
    expect(html).toContain("height:auto");
    expect(html).toContain("max-height:40px");
    expect(html).toContain('border="0"');
    expect(html).toContain("display:block");
    expect(html).toContain(">Doly Stores</div>");
    expect(html).toContain("color:#ffffff");
    expect(html).toContain('bgcolor="#a92222"');
    expect(html).toContain('height="4"');
    expect(html).toContain("table-layout:fixed");
    expect(html).not.toContain("#7d1414");
    expect(html).not.toContain(EMAIL_LOGO_FALLBACK);
    const headerRow = leafRows(html).find(
      (row) => row.includes('width="32%"') && row.includes('alt="Doly Stores"')
    );
    expect(headerRow).toBeTruthy();
    expect(headerRow).toContain('src="https://cdn.example/wordmark.svg"');
    expect(headerRow).toContain(">Doly Stores</div>");
    expect(headerRow).toContain("تأكيد طلبك #DOLY-1");
    expect(headerRow).toContain('width="34%"');
    expect(headerRow).toContain("border-radius:12px");
    expect(headerRow).toMatch(/<td\b[^>]*width="32%"[^>]*border-radius:12px[^>]*>/);
    expect(sendMock.mock.calls[0]?.[0]?.subject).toBe("تأكيد طلبك #DOLY-1");
  });

  it("rejects a relative logo url and keeps the production wordmark", async () => {
    process.env.ADMIN_NOTIFICATION_EMAIL = "one@example.com";
    brandingMock.mockResolvedValue({ logoUrl: "/images/store-mark.png" });
    await sendOrderEmail("new-order-admin", orderMail);
    const html = sendMock.mock.calls[0]?.[0]?.html as string;
    expect(html).toContain(`src="${EMAIL_LOGO_FALLBACK}"`);
    expect(html).toContain('alt="Doly Stores"');
    expect(html).not.toContain("/images/store-mark.png");
    expect(html).not.toContain('src="/branding/doly-wordmark.svg"');
    const headerRow = leafRows(html).find((row) => row.includes('width="32%"'));
    expect(headerRow).toContain(`src="${EMAIL_LOGO_FALLBACK}"`);
    expect(headerRow).toContain("border-radius:12px");
    expect(headerRow).not.toContain("/images/store-mark.png");
    expect(sendMock.mock.calls[0]?.[0]?.subject).toBe("طلب جديد #DOLY-1");

    brandingMock.mockResolvedValue({ logoUrl: "/branding/doly-wordmark.svg" });
    sendMock.mockClear();
    await sendOrderEmail("new-order-admin", orderMail);
    const relativeHtml = sendMock.mock.calls[0]?.[0]?.html as string;
    expect(relativeHtml).toContain(`src="${EMAIL_LOGO_FALLBACK}"`);
    expect(relativeHtml).not.toContain('src="/branding/doly-wordmark.svg"');
  });

  it("uses the production wordmark when branding cannot be read", async () => {
    brandingMock.mockRejectedValue(new Error("settings unavailable"));
    const result = await sendOrderEmail("order-confirmed-customer", orderMail);
    expect(result.status).toBe("sent");
    const html = sendMock.mock.calls[0]?.[0]?.html as string;
    expect(html).toContain(`src="${EMAIL_LOGO_FALLBACK}"`);
    expect(html).toContain('alt="Doly Stores"');
    expect(html).toContain(">Doly Stores</div>");
  });

  it("escapes an absolute svg logo and still shows the text fallback", async () => {
    brandingMock.mockResolvedValue({ logoUrl: 'https://cdn.example/wordmark.svg?x="><script>' });
    await sendOrderEmail("order-confirmed-customer", orderMail);
    const html = sendMock.mock.calls[0]?.[0]?.html as string;
    expect(html).toContain("<img");
    expect(html).toContain("https://cdn.example/wordmark.svg?x=&quot;&gt;&lt;script&gt;");
    expect(html).toContain('alt="Doly Stores"');
    expect(html).toContain(">Doly Stores</div>");
    expect(html).not.toContain("<script>");
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
    expect(payload.reply_to).toBe("sales@eldawlystores.shop");
    expect(payload.html).toContain('dir="rtl"');
    expect(payload.html).toContain("<table");
    expect(payload.html).toContain("رقم الطلب: DOLY-9");
    expect(payload.html).toContain(totalFormatted);
    expect(payload.html).toContain(lineTotalFormatted);
    expect(payload.html).toContain("الكمية 2");
    expect(payload.html).toContain("&lt;script&gt;");
    expect(payload.html).toContain("هاتف &amp; &quot;جديد&quot;");
    expect(payload.html).not.toContain("<script>");
    expect(payload.text).toContain("تأكيد طلبك #DOLY-9");
    expect(payload.text).toContain("رقم الطلب: DOLY-9");
    expect(payload.text).toContain(totalFormatted);
    expect(payload.text).toContain(lineTotalFormatted);
    expect(payload.text).toContain("الكمية 2");
    expect(payload.text).toContain(`هاتف & "جديد"`);
    expect(payload.text).toContain("أحمد <script>");
    expect(payload.text).not.toContain("&amp;");
    expect(payload.text).not.toContain("&lt;");
  });

  it("renders an image only for an absolute http(s) url", () => {
    const totalFormatted = formatMoney(150000);
    const lineTotal = formatMoney(100000);
    const payload = buildOrderEmailHtml("order-confirmed-customer", {
      orderNumber: "DOLY-2",
      customerName: "أحمد",
      totalFormatted,
      lines: [
        {
          productName: "هاتف ظاهر",
          sku: "SKU-1",
          quantity: 1,
          unitPriceFormatted: lineTotal,
          lineTotalFormatted: lineTotal,
          imageUrl: "https://cdn.example/phone.jpg",
        },
        {
          productName: "بدون صورة",
          quantity: 1,
          lineTotalFormatted: formatMoney(50000),
          imageUrl: "/placeholder-product.svg",
        },
        {
          productName: "مفتاح تخزين",
          quantity: 1,
          lineTotalFormatted: formatMoney(10000),
          imageUrl: "products/phone.jpg",
        },
      ],
    });

    expect(payload.html.match(/<img\b/g)).toHaveLength(2);
    expect(payload.html).toContain(`src="${EMAIL_LOGO_FALLBACK}"`);
    expect(payload.html).toContain("https://cdn.example/phone.jpg");
    expect(payload.html).not.toContain("placeholder-product.svg");
    expect(payload.html).not.toContain("products/phone.jpg");
    expect(payload.html).toContain("table-layout:fixed");
    expect(payload.text).toContain("https://cdn.example/phone.jpg");
    expect(payload.text).not.toContain("placeholder-product.svg");

    const productRow = leafRows(payload.html).find(
      (row) => row.includes("https://cdn.example/phone.jpg") && row.includes("هاتف ظاهر")
    );
    expect(productRow).toBeTruthy();
    expect(productRow).toContain(lineTotal);
    expect(productRow).toContain('width="18%"');
    expect(productRow).toContain('width="46%"');
    expect(productRow).toContain('width="36%"');
    expect(productRow).toContain("border-radius:8px");
    expect(productRow).toContain("SKU-1");
    const productHeader = leafRows(payload.html).find(
      (row) => row.includes(">صورة<") && row.includes(">المنتج<")
    );
    expect(productHeader).toContain('width="18%"');
    expect(productHeader).toContain('width="46%"');
    expect(productHeader).toContain('width="36%"');
    for (const name of ["بدون صورة", "مفتاح تخزين"]) {
      const emptyRow = leafRows(payload.html).find((row) => row.includes(name));
      expect(emptyRow).toBeTruthy();
      expect(emptyRow).not.toContain("<img");
      expect(emptyRow).toContain('width="18%"');
    }

    const httpPayload = buildOrderEmailHtml("order-confirmed-customer", {
      orderNumber: "DOLY-2",
      customerName: "أحمد",
      totalFormatted,
      lines: [
        {
          productName: "هاتف",
          quantity: 1,
          lineTotalFormatted: lineTotal,
          imageUrl: "http://cdn.example/phone.jpg",
        },
      ],
    });
    expect(httpPayload.html.match(/<img\b/g)).toHaveLength(2);

    const hostile = buildOrderEmailHtml("order-confirmed-customer", {
      orderNumber: "DOLY-2",
      customerName: "أحمد",
      totalFormatted,
      lines: [
        {
          productName: 'صورة <script>',
          quantity: 1,
          lineTotalFormatted: lineTotal,
          imageUrl: 'https://cdn.example/a.jpg?x="><script>',
        },
      ],
    });
    expect(hostile.html).toContain("<img");
    expect(hostile.html).toContain("&quot;");
    expect(hostile.html).toContain("&lt;script&gt;");
    expect(hostile.html).not.toContain("<script>");
    expect(hostile.text).toContain('https://cdn.example/a.jpg?x="><script>');
    expect(hostile.text).toContain('صورة <script>');
    expect(hostile.text).not.toContain("&lt;");
  });

  it("includes building and floor only when they were saved", () => {
    const base = {
      orderNumber: "DOLY-3",
      customerName: "أحمد",
      customerPhone: "01099999999",
      totalFormatted: formatMoney(10000),
      paymentMethod: "cod",
      status: "pending",
    };
    const withFloor = buildOrderEmailHtml("new-order-admin", {
      ...base,
      shippingAddress: {
        governorate: "القاهرة",
        city: "مدينة نصر",
        street: "عباس العقاد",
        building: "12",
        floor: "3",
      },
    });
    expect(withFloor.html).toContain("01099999999");
    expect(withFloor.html).toContain("الدفع عند الاستلام");
    expect(withFloor.html).toContain("قيد الانتظار");
    expect(withFloor.text).toContain("العنوان: القاهرة، مدينة نصر، عباس العقاد، 12، 3");
    expect(withFloor.text).toContain("الهاتف: 01099999999");

    const without = buildOrderEmailHtml("new-order-admin", {
      ...base,
      shippingAddress: {
        governorate: "القاهرة",
        city: "مدينة نصر",
        street: "عباس العقاد",
        building: " ",
        floor: "",
      },
    });
    expect(without.text).toContain("العنوان: القاهرة، مدينة نصر، عباس العقاد");
    expect(without.text).not.toContain("عباس العقاد،");
  });

  it("keeps shipped mail as the shorter notice", () => {
    const payload = buildOrderEmailHtml("order-shipped", {
      ...orderMail,
      status: "shipped",
    });
    expect(payload.html).not.toContain("<table");
    expect(payload.html).not.toContain("#1a211e");
    expect(payload.html).not.toContain(EMAIL_LOGO_FALLBACK);
    expect(payload.html).toContain("تم شحن طلبك #DOLY-1");
    expect(payload.html).toContain("الحالة: shipped");
    expect(payload.text).not.toContain("الدفع عند الاستلام");
    expect(payload.text).not.toContain("قيد الانتظار");
  });
});

describe("resolveEmailLogoUrl", () => {
  it("keeps an absolute http(s) logo and rejects relative values", () => {
    expect(resolveEmailLogoUrl("https://cdn.example/wordmark.svg")).toBe("https://cdn.example/wordmark.svg");
    expect(resolveEmailLogoUrl("http://cdn.example/wordmark.svg")).toBe("http://cdn.example/wordmark.svg");
    expect(resolveEmailLogoUrl("  https://cdn.example/wordmark.svg  ")).toBe("https://cdn.example/wordmark.svg");
    expect(resolveEmailLogoUrl("/branding/doly-wordmark.svg")).toBe(EMAIL_LOGO_FALLBACK);
    expect(resolveEmailLogoUrl("/images/store-mark.png")).toBe(EMAIL_LOGO_FALLBACK);
    expect(resolveEmailLogoUrl("")).toBe(EMAIL_LOGO_FALLBACK);
    expect(resolveEmailLogoUrl(undefined)).toBe(EMAIL_LOGO_FALLBACK);
  });
});

describe("resolveEmailImageUrl", () => {
  const previousPublic = process.env.R2_PUBLIC_URL;

  afterEach(() => {
    if (previousPublic === undefined) delete process.env.R2_PUBLIC_URL;
    else process.env.R2_PUBLIC_URL = previousPublic;
  });

  it("keeps absolute urls and drops relative paths", () => {
    process.env.R2_PUBLIC_URL = "https://cdn.example";
    expect(resolveEmailImageUrl("https://cdn.example/phone.jpg")).toBe("https://cdn.example/phone.jpg");
    expect(resolveEmailImageUrl("http://cdn.example/phone.jpg")).toBe("http://cdn.example/phone.jpg");
    expect(resolveEmailImageUrl("/placeholder-product.svg")).toBeUndefined();
    expect(resolveEmailImageUrl("../secret.jpg")).toBeUndefined();
    expect(resolveEmailImageUrl("javascript:alert(1)")).toBeUndefined();
    expect(resolveEmailImageUrl("  ")).toBeUndefined();
  });

  it("uses getPublicUrl only for a bare key when the result is https", () => {
    process.env.R2_PUBLIC_URL = "https://cdn.example";
    expect(resolveEmailImageUrl("products/phone.jpg")).toBe("https://cdn.example/products/phone.jpg");
    process.env.R2_PUBLIC_URL = "http://cdn.example";
    expect(resolveEmailImageUrl("products/phone.jpg")).toBeUndefined();
    delete process.env.R2_PUBLIC_URL;
    expect(resolveEmailImageUrl("products/phone.jpg")).toBeUndefined();
  });
});
