import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
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
  ADMIN_SIGN_IN_PATH: "/auth/admin/signin",
  getAdminSignInUrl: vi.fn(() => "/auth/admin/signin"),
}));

vi.mock("@/app/(auth)/auth/signup/comp/social_login/action", () => ({
  logoutTo: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
  usePathname: vi.fn(() => "/admin-account"),
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
import { adminNavGroups, getAdminPageTitle } from "./components/shell/admin-nav";
import AdminSidebar from "./components/shell/admin-sidebar";
import { getSidebarAccessibilityProps } from "./components/shell/admin-sidebar";
import { AdminMetricCard } from "./components/ui/admin-metric-card";
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

describe("admin navigation foundation", () => {
  it("uses workflow groups with Admins and Account destination labels", () => {
    expect(
      adminNavGroups.map((group) => ({
        title: group.title,
        items: group.items.map((item) => item.label),
      })),
    ).toEqual([
      { title: "Overview", items: ["Dashboard"] },
      { title: "Fulfillment", items: ["Orders", "Payments"] },
      { title: "Catalog", items: ["Products", "Coupons", "Reviews"] },
      { title: "Growth", items: ["Analytics"] },
      { title: "Team", items: ["Admins"] },
      { title: "Settings", items: ["Account"] },
    ]);

    expect(
      adminNavGroups
        .flatMap((group) => group.items)
        .find((item) => item.href === "/admin-account/team"),
    ).toMatchObject({ label: "Admins", superAdminOnly: true });
  });

  it("returns updated titles for admin team and account settings pages", () => {
    expect(getAdminPageTitle("/admin-account/team")).toBe("Admins");
    expect(getAdminPageTitle("/admin-account/details")).toBe("Account");
    expect(getAdminPageTitle("/admin-account/products/123")).toBe(
      "Edit product",
    );
  });
});

describe("admin shell accessibility primitives", () => {
  it("removes the closed mobile sidebar from assistive tech and tab order", () => {
    expect(getSidebarAccessibilityProps(false)).toEqual({
      "aria-hidden": true,
      inert: true,
    });

    expect(getSidebarAccessibilityProps(true)).toEqual({
      "aria-hidden": undefined,
      inert: undefined,
    });
  });

  it("keeps desktop sidebar accessible while isolating the closed mobile drawer on first render", () => {
    const html = renderToStaticMarkup(
      React.createElement(AdminSidebar, {
        user: {
          email: "admin@example.com",
          role: "super_admin",
        },
        open: false,
        onClose: vi.fn(),
      }),
    );

    const desktopAside = html.match(
      /<aside[^>]*aria-label="Admin navigation"[^>]*>/,
    )?.[0];
    const mobileAside = html.match(
      /<aside[^>]*aria-label="Mobile admin navigation"[^>]*>/,
    )?.[0];

    expect(desktopAside).toBeDefined();
    expect(desktopAside).not.toContain("aria-hidden");
    expect(desktopAside).not.toContain("inert");
    expect(mobileAside).toContain('aria-hidden="true"');
    expect(mobileAside).toContain("inert");
  });
});

describe("admin UI primitives", () => {
  it("renders metric card detail ahead of legacy meta text", () => {
    const metric = AdminMetricCard({
      label: "Payments",
      value: "KSh 12,400",
      tone: "info",
      detail: "Awaiting reconciliation",
      meta: "Legacy fallback",
    });

    expect(metric.props.children[1].props.children).toBe(
      "Awaiting reconciliation",
    );
  });
});
