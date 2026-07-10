import { describe, expect, it } from "vitest";
import { loginSchema } from "./zod";

describe("loginSchema", () => {
  it("does not reveal password composition rules during sign in", () => {
    const result = loginSchema.safeParse({
      email: "admin@example.com",
      password: "simple",
    });

    expect(result.success).toBe(true);
  });

  it("uses a neutral message when the password is missing", () => {
    const result = loginSchema.safeParse({
      email: "admin@example.com",
      password: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Enter your password");
    }
  });
});
