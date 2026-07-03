import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ADMIN_SIGN_IN_PATH,
  getAdminCallbackUrl,
  getAdminSignInUrl,
} from "./admin-login";

vi.mock("server-only", () => ({}));

vi.mock("next-auth", () => ({
  AuthError: class AuthError extends Error {
    type = "CredentialsSignin";
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth/action/auth/auth", () => ({
  auth: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

import { auth, signIn, signOut } from "@/lib/auth/action/auth/auth";
import { doAdminCredentialLogin } from "@/lib/auth/action/doAdminCredentialLogin";
import prisma from "@/lib/prisma";

const mockedAuth = vi.mocked(auth);
const mockedSignIn = vi.mocked(signIn);
const mockedSignOut = vi.mocked(signOut);
const mockedFindUnique = vi.mocked(prisma.user.findUnique);

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

describe("doAdminCredentialLogin", () => {
  beforeEach(() => {
    mockedAuth.mockReset();
    mockedSignIn.mockReset();
    mockedSignOut.mockReset();
    mockedFindUnique.mockReset();
  });

  it("rejects disabled admin accounts with a friendly error", async () => {
    mockedSignIn.mockResolvedValue(undefined as never);
    mockedAuth.mockResolvedValue({
      user: { id: "1", email: "admin@jkorganics.com", role: "min_admin" },
    });
    mockedFindUnique.mockResolvedValue({
      disabledAt: new Date("2026-02-01"),
      deletedAt: null,
    } as never);

    const result = await doAdminCredentialLogin({
      email: "admin@jkorganics.com",
      password: "password",
    });

    expect(mockedFindUnique).toHaveBeenCalledWith({
      where: { id: "1" },
      select: { disabledAt: true, deletedAt: true },
    });
    expect(mockedSignOut).toHaveBeenCalledWith({ redirect: false });
    expect(result).toEqual({
      error: "This admin account is blocked. Contact the store owner.",
    });
  });

  it("rejects deleted admin accounts with a friendly error", async () => {
    mockedSignIn.mockResolvedValue(undefined as never);
    mockedAuth.mockResolvedValue({
      user: { id: "1", email: "admin@jkorganics.com", role: "super_admin" },
    });
    mockedFindUnique.mockResolvedValue({
      disabledAt: null,
      deletedAt: new Date("2026-02-01"),
    } as never);

    const result = await doAdminCredentialLogin({
      email: "admin@jkorganics.com",
      password: "password",
    });

    expect(mockedSignOut).toHaveBeenCalledWith({ redirect: false });
    expect(result).toEqual({
      error: "This admin account is no longer active.",
    });
  });

  it("keeps successful admin login behavior", async () => {
    mockedSignIn.mockResolvedValue(undefined as never);
    mockedAuth.mockResolvedValue({
      user: { id: "1", email: "admin@jkorganics.com", role: "min_admin" },
    });
    mockedFindUnique.mockResolvedValue({
      disabledAt: null,
      deletedAt: null,
    } as never);

    const result = await doAdminCredentialLogin({
      email: "admin@jkorganics.com",
      password: "password",
      callbackUrl: "/admin-account/products",
    });

    expect(result).toEqual({
      success: true,
      redirectTo: "/admin-account/products",
    });
    expect(mockedSignOut).not.toHaveBeenCalled();
  });
});
