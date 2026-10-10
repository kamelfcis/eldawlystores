import { describe, expect, it } from "vitest";
import { authErrorMessage } from "@/lib/auth/errors";
import {
  PASSWORD_MISMATCH,
  PASSWORD_SAME_AS_CURRENT,
  PASSWORD_TOO_SHORT,
  validatePasswordChange,
} from "@/lib/account/password-validation";
import {
  planReorder,
  REORDER_SKIP_INACTIVE,
  REORDER_SKIP_MISSING,
  REORDER_SKIP_OUT_OF_STOCK,
  type ReorderVariant,
} from "@/lib/account/reorder";
import { ORDER_STATUS_LABELS } from "@/lib/account/order-status";
import type { OrderStatus } from "@/lib/types/database";

describe("authErrorMessage", () => {
  it("maps weak password", () => {
    expect(authErrorMessage({ code: "weak_password" })).toBe(
      "كلمة المرور ضعيفة. استخدم 8 أحرف على الأقل"
    );
  });

  it("maps wrong password", () => {
    expect(authErrorMessage({ code: "invalid_credentials" })).toBe("كلمة المرور غير صحيحة");
  });
});

describe("validatePasswordChange", () => {
  it("rejects mismatched confirmation", () => {
    expect(
      validatePasswordChange({
        currentPassword: "old-password",
        newPassword: "new-password",
        confirmPassword: "other-password",
        requiresCurrent: true,
      })
    ).toBe(PASSWORD_MISMATCH);
  });

  it("rejects passwords shorter than 8 characters", () => {
    expect(
      validatePasswordChange({
        currentPassword: "old-password",
        newPassword: "short",
        confirmPassword: "short",
        requiresCurrent: true,
      })
    ).toBe(PASSWORD_TOO_SHORT);
  });

  it("rejects reusing the current password", () => {
    expect(
      validatePasswordChange({
        currentPassword: "same-password",
        newPassword: "same-password",
        confirmPassword: "same-password",
        requiresCurrent: true,
      })
    ).toBe(PASSWORD_SAME_AS_CURRENT);
  });
});

describe("planReorder", () => {
  const activeProduct = {
    id: "prod-1",
    nameAr: "منتج",
    slug: "product",
    status: "active" as const,
    imageUrl: "/img.jpg",
  };

  function variant(overrides: Partial<ReorderVariant> & { id: string }): ReorderVariant {
    return {
      sku: "SKU-1",
      pricePiasters: 2500,
      compareAtPiasters: null,
      stock: 5,
      product: activeProduct,
      ...overrides,
    };
  }

  it("adds available lines at current price and capped quantity", () => {
    const variants = new Map<string, ReorderVariant>([
      ["var-1", variant({ id: "var-1", pricePiasters: 3200, stock: 3 })],
    ]);

    const plan = planReorder([{ variantId: "var-1", quantity: 10 }], variants);

    expect(plan.skipped).toHaveLength(0);
    expect(plan.addable).toHaveLength(1);
    expect(plan.addable[0]?.quantity).toBe(3);
    expect(plan.addable[0]?.item.unitPricePiasters).toBe(3200);
    expect(plan.addable[0]?.item.unitPricePiasters).not.toBe(9999);
  });

  it("skips zero-stock variants", () => {
    const variants = new Map<string, ReorderVariant>([
      ["var-1", variant({ id: "var-1", stock: 0 })],
    ]);

    const plan = planReorder([{ variantId: "var-1", quantity: 1 }], variants);

    expect(plan.addable).toHaveLength(0);
    expect(plan.skipped[0]?.reason).toBe(REORDER_SKIP_OUT_OF_STOCK);
  });

  it("skips missing variants", () => {
    const plan = planReorder([{ variantId: "missing", quantity: 1 }], new Map());

    expect(plan.addable).toHaveLength(0);
    expect(plan.skipped[0]?.reason).toBe(REORDER_SKIP_MISSING);
  });

  it("skips inactive products", () => {
    const variants = new Map<string, ReorderVariant>([
      [
        "var-1",
        variant({
          id: "var-1",
          product: { ...activeProduct, status: "archived" },
        }),
      ],
    ]);

    const plan = planReorder([{ variantId: "var-1", quantity: 1 }], variants);

    expect(plan.addable).toHaveLength(0);
    expect(plan.skipped[0]?.reason).toBe(REORDER_SKIP_INACTIVE);
  });
});

describe("ORDER_STATUS_LABELS", () => {
  const statuses: OrderStatus[] = [
    "pending",
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
    "rejected",
  ];

  it("covers every OrderStatus value", () => {
    for (const status of statuses) {
      expect(ORDER_STATUS_LABELS[status]).toBeTruthy();
    }
  });

  it("uses قيد الانتظار for pending", () => {
    expect(ORDER_STATUS_LABELS.pending).toBe("قيد الانتظار");
  });
});
