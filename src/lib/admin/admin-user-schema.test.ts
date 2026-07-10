import { describe, expect, it } from "vitest";
import {
  adminStatusSchema,
  resetAdminPasswordSchema,
} from "./admin-user-schema";

describe("resetAdminPasswordSchema", () => {
  it("accepts matching passwords with at least 8 characters", () => {
    const result = resetAdminPasswordSchema.safeParse({
      password: "newpass123",
      confirmPassword: "newpass123",
    });

    expect(result.success).toBe(true);
  });

  it("rejects mismatched password confirmation", () => {
    const result = resetAdminPasswordSchema.safeParse({
      password: "newpass123",
      confirmPassword: "different123",
    });

    expect(result.success).toBe(false);
  });
});

describe("adminStatusSchema", () => {
  it("accepts an explicit disabled flag", () => {
    expect(adminStatusSchema.safeParse({ disabled: true }).success).toBe(true);
    expect(adminStatusSchema.safeParse({ disabled: false }).success).toBe(true);
  });

  it("rejects requests without a disabled flag", () => {
    expect(adminStatusSchema.safeParse({}).success).toBe(false);
  });
});
