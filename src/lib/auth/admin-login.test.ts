import { describe, expect, it } from "vitest";
import {
  ADMIN_SIGN_IN_PATH,
  getAdminCallbackUrl,
  getAdminSignInUrl,
} from "./admin-login";

describe("admin login helpers", () => {
  it("defaults callback to admin dashboard", () => {
    expect(getAdminCallbackUrl()).toBe("/admin-account");
    expect(getAdminCallbackUrl("/account")).toBe("/admin-account");
  });

  it("keeps valid admin callback urls", () => {
    expect(getAdminCallbackUrl("/admin-account/orders")).toBe(
      "/admin-account/orders",
    );
  });

  it("builds admin sign in url", () => {
    expect(getAdminSignInUrl()).toBe(ADMIN_SIGN_IN_PATH);
    expect(getAdminSignInUrl("/admin-account/products")).toBe(
      "/auth/admin/signin?callbackUrl=%2Fadmin-account%2Fproducts",
    );
  });
});
