import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/admin/require-admin", () => ({
  requireSuperAdminSession: vi.fn(),
}));

vi.mock("@/lib/auth/getSession", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/auth/admin-login", () => ({
  getAdminSignInUrl: vi.fn(
    (callbackUrl?: string) =>
      `/auth/admin/signin${callbackUrl ? `?callbackUrl=${callbackUrl}` : ""}`,
  ),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
}));

import { redirect } from "next/navigation";
import { requireSuperAdminSession } from "@/lib/admin/require-admin";
import { getSession } from "@/lib/auth/getSession";
import TeamLayout from "./layout";

const mockedRequireSuperAdminSession = vi.mocked(requireSuperAdminSession);
const mockedGetSession = vi.mocked(getSession);
const mockedRedirect = vi.mocked(redirect);

describe("TeamLayout", () => {
  beforeEach(() => {
    mockedRequireSuperAdminSession.mockReset();
    mockedGetSession.mockReset();
    mockedRedirect.mockClear();
  });

  it("redirects unauthenticated users to the admin team sign-in callback", async () => {
    mockedRequireSuperAdminSession.mockResolvedValue({
      error: "Unauthorized",
      status: 401,
      session: null,
    });
    mockedGetSession.mockResolvedValue({
      user: { id: "1", email: "owner@example.com", role: "super_admin" },
    });

    await expect(
      TeamLayout({ children: React.createElement("div") }),
    ).rejects.toThrow(
      "redirect:/auth/admin/signin?callbackUrl=/admin-account/team",
    );

    expect(mockedRedirect).toHaveBeenCalledWith(
      "/auth/admin/signin?callbackUrl=/admin-account/team",
    );
  });

  it("redirects non-super-admin guard failures to the admin dashboard", async () => {
    mockedRequireSuperAdminSession.mockResolvedValue({
      error: "Forbidden",
      status: 403,
      session: null,
    });
    mockedGetSession.mockResolvedValue({
      user: { id: "1", email: "owner@example.com", role: "super_admin" },
    });

    await expect(
      TeamLayout({ children: React.createElement("div") }),
    ).rejects.toThrow("redirect:/admin-account");

    expect(mockedRedirect).toHaveBeenCalledWith("/admin-account");
  });
});
