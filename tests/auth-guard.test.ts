import { describe, expect, it } from "vitest";
import { loginRedirect } from "@/lib/auth/login-redirect";

describe("loginRedirect", () => {
  it("sends a signed-in user to /account", () => {
    expect(loginRedirect("user-1")).toBe("/account");
  });

  it("leaves logged-out visitors on the form", () => {
    expect(loginRedirect(null)).toBeNull();
  });
});
