import { describe, expect, it } from "vitest";
import { notifyToastId } from "@/lib/feedback/notify";

describe("notifyToastId", () => {
  it("returns the message as a stable dedupe id", () => {
    const message = "أُضيف إلى السلة";
    expect(notifyToastId(message)).toBe(message);
    expect(notifyToastId(message)).toBe(notifyToastId(message));
  });

  it("keeps distinct ids for distinct messages", () => {
    expect(notifyToastId("تم الحفظ")).not.toBe(notifyToastId("تعذر الحفظ"));
  });
});
