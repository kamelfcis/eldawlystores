import { beforeEach, describe, expect, it, vi } from "vitest";

const { assertAdminMock, revalidatePathMock, maybeSingleMock, insertMock, updateMock, settingsQueryMock } = vi.hoisted(
  () => ({
    assertAdminMock: vi.fn(async () => ({ userId: "admin-1" })),
    revalidatePathMock: vi.fn(),
    maybeSingleMock: vi.fn(async (): Promise<{ data: { value?: unknown } | null; error: { message: string } | null }> => ({
      data: null,
      error: null,
    })),
    insertMock: vi.fn(async () => ({ error: null })),
    updateMock: vi.fn((payload?: unknown) => {
      void payload;
      return { eq: vi.fn(async () => ({ error: null })) };
    }),
    settingsQueryMock: vi.fn(
      async (): Promise<{ data: Array<{ key: string; value: unknown }> | null; error: { message: string } | null }> => ({
        data: [],
        error: null,
      })
    ),
  })
);

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

vi.mock("@/lib/auth", () => ({
  assertAdmin: assertAdminMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: (table: string) => {
      if (table === "shipping_rates") {
        return {
          select: () => ({
            order: async () => ({ data: [], error: null }),
          }),
        };
      }
      return {
        select: () => ({
          in: async () => settingsQueryMock(),
          eq: () => ({
            maybeSingle: maybeSingleMock,
          }),
        }),
        insert: insertMock,
        update: (payload: unknown) => updateMock(payload),
      };
    },
  }),
}));

import { saveAdminNotificationEmails } from "@/lib/admin/actions";
import {
  ADMIN_NOTIFICATION_EMAIL_MESSAGES,
  ADMIN_NOTIFICATION_EMAILS_KEY,
  formEmailsFromAdminSetting,
  parseStoredAdminNotificationInboxes,
  resolveAdminNotificationEmails,
  validateAdminNotificationEmails,
} from "@/lib/admin/notification-emails";
import { getAdminSettings } from "@/lib/admin/queries";

function formDataWithEmails(emails: unknown): FormData {
  const formData = new FormData();
  formData.set("emails_json", JSON.stringify(emails));
  return formData;
}

describe("validateAdminNotificationEmails", () => {
  it("rejects an invalid address without producing a list", () => {
    const result = validateAdminNotificationEmails(["not-an-email"]);
    expect(result).toEqual({ ok: false, error: ADMIN_NOTIFICATION_EMAIL_MESSAGES.invalid });
  });

  it("rejects a javascript: address", () => {
    const result = validateAdminNotificationEmails(["javascript:alert(1)"]);
    expect(result).toEqual({ ok: false, error: ADMIN_NOTIFICATION_EMAIL_MESSAGES.invalid });
  });

  it("rejects a blank address", () => {
    const result = validateAdminNotificationEmails(["   "]);
    expect(result).toEqual({ ok: false, error: ADMIN_NOTIFICATION_EMAIL_MESSAGES.empty });
  });

  it("rejects a case-insensitive duplicate", () => {
    const result = validateAdminNotificationEmails(["Orders@example.com", "orders@example.com"]);
    expect(result).toEqual({ ok: false, error: ADMIN_NOTIFICATION_EMAIL_MESSAGES.duplicate });
  });

  it("rejects an eleventh address", () => {
    const emails = Array.from({ length: 11 }, (_, index) => `user${index}@example.com`);
    const result = validateAdminNotificationEmails(emails);
    expect(result).toEqual({ ok: false, error: ADMIN_NOTIFICATION_EMAIL_MESSAGES.maxCount });
  });

  it("rejects a list over the character limit", () => {
    const longLocal = "a".repeat(1990);
    const result = validateAdminNotificationEmails([`${longLocal}@example.com`]);
    expect(result).toEqual({ ok: false, error: ADMIN_NOTIFICATION_EMAIL_MESSAGES.maxChars });
  });

  it("keeps first-seen casing and order for a valid list", () => {
    const result = validateAdminNotificationEmails([" Orders@example.com ", "ops@example.com"]);
    expect(result).toEqual({
      ok: true,
      inboxes: [
        { email: "Orders@example.com", enabled: true },
        { email: "ops@example.com", enabled: true },
      ],
    });
  });

  it("allows an explicit empty list", () => {
    expect(validateAdminNotificationEmails([])).toEqual({ ok: true, inboxes: [] });
  });

  it("accepts inbox objects and keeps disabled addresses in the list", () => {
    const result = validateAdminNotificationEmails([
      { email: "live@example.com", enabled: true },
      { email: "quiet@example.com", enabled: false },
    ]);
    expect(result).toEqual({
      ok: true,
      inboxes: [
        { email: "live@example.com", enabled: true },
        { email: "quiet@example.com", enabled: false },
      ],
    });
  });

  it("counts a disabled address toward the ten-address limit", () => {
    const inboxes = Array.from({ length: 11 }, (_, index) => ({
      email: `user${index}@example.com`,
      enabled: index === 0,
    }));
    expect(validateAdminNotificationEmails(inboxes)).toEqual({
      ok: false,
      error: ADMIN_NOTIFICATION_EMAIL_MESSAGES.maxCount,
    });
  });

  it("counts a disabled address toward the character limit", () => {
    const result = validateAdminNotificationEmails([{ email: `${"a".repeat(1990)}@example.com`, enabled: false }]);
    expect(result).toEqual({ ok: false, error: ADMIN_NOTIFICATION_EMAIL_MESSAGES.maxChars });
  });
});

describe("formEmailsFromAdminSetting", () => {
  it("seeds the form from env when the row is missing", () => {
    expect(formEmailsFromAdminSetting({ kind: "missing" }, "one@example.com, two@example.com")).toEqual({
      inboxes: [
        { email: "one@example.com", enabled: true },
        { email: "two@example.com", enabled: true },
      ],
      emptyListSaved: false,
    });
  });

  it("does not merge env after a saved list", () => {
    expect(
      formEmailsFromAdminSetting(
        { kind: "saved", inboxes: [{ email: "saved@example.com", enabled: true }] },
        "env@example.com"
      )
    ).toEqual({
      inboxes: [{ email: "saved@example.com", enabled: true }],
      emptyListSaved: false,
    });
  });

  it("keeps a saved empty list empty and marks the warning", () => {
    expect(formEmailsFromAdminSetting({ kind: "saved", inboxes: [] }, "env@example.com")).toEqual({
      inboxes: [],
      emptyListSaved: true,
    });
  });

  it("shows disabled saved addresses without merging env", () => {
    expect(
      formEmailsFromAdminSetting(
        { kind: "saved", inboxes: [{ email: "quiet@example.com", enabled: false }] },
        "env@example.com"
      )
    ).toEqual({
      inboxes: [{ email: "quiet@example.com", enabled: false }],
      emptyListSaved: false,
    });
  });

  it("does not pretend a failed read is an intentional empty list", () => {
    expect(formEmailsFromAdminSetting({ kind: "unavailable" }, "env@example.com")).toEqual({
      inboxes: [],
      emptyListSaved: false,
    });
  });
});

describe("resolveAdminNotificationEmails", () => {
  it("sends only enabled addresses from a saved list", () => {
    expect(
      resolveAdminNotificationEmails(
        {
          state: "saved",
          inboxes: [
            { email: "live@example.com", enabled: true },
            { email: "quiet@example.com", enabled: false },
          ],
        },
        "env@example.com"
      )
    ).toEqual({ emails: ["live@example.com"], unavailable: false });
  });

  it("does not restore env when every saved address is disabled", () => {
    expect(
      resolveAdminNotificationEmails(
        { state: "saved", inboxes: [{ email: "quiet@example.com", enabled: false }] },
        "env@example.com"
      )
    ).toEqual({ emails: [], unavailable: false });
  });

  it("still sends a legacy string array as all enabled", () => {
    const inboxes = parseStoredAdminNotificationInboxes(["legacy@example.com", "ops@example.com"]);
    expect(resolveAdminNotificationEmails({ state: "saved", inboxes }, "env@example.com")).toEqual({
      emails: ["legacy@example.com", "ops@example.com"],
      unavailable: false,
    });
  });

  it("falls back to env only when the row is missing", () => {
    expect(resolveAdminNotificationEmails({ state: "missing" }, "env@example.com")).toEqual({
      emails: ["env@example.com"],
      unavailable: false,
    });
  });
});

describe("getAdminSettings notification key", () => {
  beforeEach(() => {
    assertAdminMock.mockReset();
    assertAdminMock.mockResolvedValue({ userId: "admin-1" });
    settingsQueryMock.mockReset();
  });

  it("includes the notification key in the existing settings query and distinguishes missing from empty", async () => {
    settingsQueryMock.mockResolvedValue({
      data: [
        { key: "whatsapp_number", value: "01012345678" },
        { key: "storefront_branding", value: {} },
      ],
      error: null,
    });
    const missing = await getAdminSettings();
    expect(missing.adminNotificationEmails).toEqual({ kind: "missing" });

    settingsQueryMock.mockResolvedValue({
      data: [{ key: ADMIN_NOTIFICATION_EMAILS_KEY, value: [] }],
      error: null,
    });
    const empty = await getAdminSettings();
    expect(empty.adminNotificationEmails).toEqual({ kind: "saved", inboxes: [] });
    expect(empty.adminNotificationEmails).not.toEqual(missing.adminNotificationEmails);

    settingsQueryMock.mockResolvedValue({
      data: [
        {
          key: ADMIN_NOTIFICATION_EMAILS_KEY,
          value: [
            { email: "live@example.com", enabled: true },
            { email: "quiet@example.com", enabled: false },
          ],
        },
      ],
      error: null,
    });
    const objects = await getAdminSettings();
    expect(objects.adminNotificationEmails).toEqual({
      kind: "saved",
      inboxes: [
        { email: "live@example.com", enabled: true },
        { email: "quiet@example.com", enabled: false },
      ],
    });

    settingsQueryMock.mockResolvedValue({
      data: [{ key: ADMIN_NOTIFICATION_EMAILS_KEY, value: ["legacy@example.com"] }],
      error: null,
    });
    const legacy = await getAdminSettings();
    expect(legacy.adminNotificationEmails).toEqual({
      kind: "saved",
      inboxes: [{ email: "legacy@example.com", enabled: true }],
    });
  });

  it("marks the setting unavailable when the settings query fails", async () => {
    settingsQueryMock.mockResolvedValue({ data: null, error: { message: "timeout" } });
    const result = await getAdminSettings();
    expect(result.adminNotificationEmails).toEqual({ kind: "unavailable" });
    expect(result.error).toBeTruthy();
  });
});

describe("saveAdminNotificationEmails", () => {
  beforeEach(() => {
    assertAdminMock.mockReset();
    assertAdminMock.mockResolvedValue({ userId: "admin-1" });
    revalidatePathMock.mockReset();
    maybeSingleMock.mockReset();
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    insertMock.mockReset();
    insertMock.mockResolvedValue({ error: null });
    updateMock.mockReset();
    updateMock.mockImplementation(() => ({ eq: vi.fn(async () => ({ error: null })) }));
  });

  it("rejects an invalid address without writing", async () => {
    const result = await saveAdminNotificationEmails(
      { error: null, saved: false, notice: null },
      formDataWithEmails(["not-an-email"])
    );
    expect(result).toEqual({ error: ADMIN_NOTIFICATION_EMAIL_MESSAGES.invalid, saved: false, notice: null });
    expect(insertMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("rejects javascript: without writing", async () => {
    const result = await saveAdminNotificationEmails(
      { error: null, saved: false, notice: null },
      formDataWithEmails(["javascript:alert(1)"])
    );
    expect(result.error).toBe(ADMIN_NOTIFICATION_EMAIL_MESSAGES.invalid);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("rejects a blank address without writing", async () => {
    const result = await saveAdminNotificationEmails(
      { error: null, saved: false, notice: null },
      formDataWithEmails([" "])
    );
    expect(result.error).toBe(ADMIN_NOTIFICATION_EMAIL_MESSAGES.empty);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("rejects a duplicate address without writing", async () => {
    const result = await saveAdminNotificationEmails(
      { error: null, saved: false, notice: null },
      formDataWithEmails(["Orders@example.com", "orders@example.com"])
    );
    expect(result.error).toBe(ADMIN_NOTIFICATION_EMAIL_MESSAGES.duplicate);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("rejects an eleventh address without writing", async () => {
    const emails = Array.from({ length: 11 }, (_, index) => `user${index}@example.com`);
    const result = await saveAdminNotificationEmails(
      { error: null, saved: false, notice: null },
      formDataWithEmails(emails)
    );
    expect(result.error).toBe(ADMIN_NOTIFICATION_EMAIL_MESSAGES.maxCount);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("rejects a list over the character limit without writing", async () => {
    const result = await saveAdminNotificationEmails(
      { error: null, saved: false, notice: null },
      formDataWithEmails([`${"a".repeat(1990)}@example.com`])
    );
    expect(result.error).toBe(ADMIN_NOTIFICATION_EMAIL_MESSAGES.maxChars);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("saves a valid list and revalidates settings", async () => {
    const result = await saveAdminNotificationEmails(
      { error: null, saved: false, notice: null },
      formDataWithEmails(["Orders@example.com"])
    );
    expect(result).toEqual({ error: null, saved: true, notice: null });
    expect(insertMock).toHaveBeenCalledWith({
      key: ADMIN_NOTIFICATION_EMAILS_KEY,
      value: [{ email: "Orders@example.com", enabled: true }],
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/settings");
  });

  it("persists an explicit empty array", async () => {
    const result = await saveAdminNotificationEmails(
      { error: null, saved: false, notice: null },
      formDataWithEmails([])
    );
    expect(result.saved).toBe(true);
    expect(insertMock).toHaveBeenCalledWith({ key: ADMIN_NOTIFICATION_EMAILS_KEY, value: [] });
  });

  it("persists enabled and disabled inbox objects", async () => {
    const result = await saveAdminNotificationEmails(
      { error: null, saved: false, notice: null },
      formDataWithEmails([
        { email: "live@example.com", enabled: true },
        { email: "quiet@example.com", enabled: false },
      ])
    );
    expect(result.saved).toBe(true);
    expect(insertMock).toHaveBeenCalledWith({
      key: ADMIN_NOTIFICATION_EMAILS_KEY,
      value: [
        { email: "live@example.com", enabled: true },
        { email: "quiet@example.com", enabled: false },
      ],
    });
  });

  it("does not save when the caller is not an administrator", async () => {
    assertAdminMock.mockImplementation(async () => {
      throw new Error("NEXT_REDIRECT");
    });
    await expect(
      saveAdminNotificationEmails({ error: null, saved: false, notice: null }, formDataWithEmails(["ok@example.com"]))
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(insertMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });
});
