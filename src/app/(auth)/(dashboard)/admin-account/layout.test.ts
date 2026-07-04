import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/admin/require-admin", () => ({
  requireAdminSession: vi.fn(),
}));

vi.mock("@/lib/auth/getSession", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/admin/fetch-admin-orders", () => ({
  fetchAdminOrders: vi.fn(),
}));

vi.mock("@/lib/auth/admin-login", () => ({
  getAdminSignInUrl: vi.fn(() => "/auth/admin/signin"),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
}));

vi.mock("../(resources)/dashboard-utils/account-context", () => ({
  default: vi.fn(({ children }) =>
    React.createElement("account-provider", null, children),
  ),
}));

vi.mock("./components/shell/admin-shell", () => ({
  default: vi.fn(({ children }) =>
    React.createElement("admin-shell", null, children),
  ),
}));

import { redirect } from "next/navigation";
import { fetchAdminOrders } from "@/lib/admin/fetch-admin-orders";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { getSession } from "@/lib/auth/getSession";
import AdminLayout from "./layout";

const mockedRequireAdminSession = vi.mocked(requireAdminSession);
const mockedGetSession = vi.mocked(getSession);
const mockedFetchAdminOrders = vi.mocked(fetchAdminOrders);
const mockedRedirect = vi.mocked(redirect);

describe("AdminLayout", () => {
  beforeEach(() => {
    mockedRequireAdminSession.mockReset();
    mockedGetSession.mockReset();
    mockedFetchAdminOrders.mockReset();
    mockedRedirect.mockClear();
  });

  it("redirects unauthenticated users to the admin sign-in page before fetching admin data", async () => {
    mockedRequireAdminSession.mockResolvedValue({
      error: "Unauthorized",
      status: 401,
      session: null,
    });
    mockedGetSession.mockResolvedValue({
      user: { id: "1", email: "admin@example.com", role: "min_admin" },
    });

    await expect(
      AdminLayout({ children: React.createElement("div") }),
    ).rejects.toThrow("redirect:/auth/admin/signin");

    expect(mockedRedirect).toHaveBeenCalledWith("/auth/admin/signin");
    expect(mockedFetchAdminOrders).not.toHaveBeenCalled();
  });

  it("redirects non-admin guard failures to the customer account page", async () => {
    mockedRequireAdminSession.mockResolvedValue({
      error: "Forbidden",
      status: 403,
      session: null,
    });
    mockedGetSession.mockResolvedValue({
      user: { id: "1", email: "admin@example.com", role: "min_admin" },
    });

    await expect(
      AdminLayout({ children: React.createElement("div") }),
    ).rejects.toThrow("redirect:/account");

    expect(mockedRedirect).toHaveBeenCalledWith("/account");
  });

  it("passes the fresh guard session to the account provider", async () => {
    const session = {
      user: { id: "1", email: "fresh-admin@example.com", role: "min_admin" },
    };
    const orders = [{ id: 42 }];
    mockedRequireAdminSession.mockResolvedValue({
      error: null,
      status: 200,
      session,
    });
    mockedFetchAdminOrders.mockResolvedValue(orders as never);

    const result = await AdminLayout({ children: React.createElement("div") });

    expect(React.isValidElement(result)).toBe(true);
    const provider = result.props.children;
    expect(provider.props.session).toBe(session);
    expect(provider.props.orders).toBe(orders);
  });
});
