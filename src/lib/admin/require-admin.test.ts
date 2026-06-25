import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  isAdminRole,
  isSuperAdminRole,
} from "./roles";
import { requireAdminSession, requireSuperAdminSession } from "./require-admin";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/auth/getSession", () => ({
  getSession: vi.fn(),
}));

import { getSession } from "@/lib/auth/getSession";

const mockedGetSession = vi.mocked(getSession);

describe("isAdminRole", () => {
  it("returns true for admin and super admin roles", () => {
    expect(isAdminRole("min_admin")).toBe(true);
    expect(isAdminRole("super_admin")).toBe(true);
    expect(isAdminRole("user")).toBe(false);
    expect(isAdminRole(undefined)).toBe(false);
  });
});

describe("isSuperAdminRole", () => {
  it("returns true only for super_admin", () => {
    expect(isSuperAdminRole("super_admin")).toBe(true);
    expect(isSuperAdminRole("min_admin")).toBe(false);
  });
});

describe("requireAdminSession", () => {
  beforeEach(() => {
    mockedGetSession.mockReset();
  });

  it("rejects unauthenticated users", async () => {
    mockedGetSession.mockResolvedValue(null);

    const result = await requireAdminSession();

    expect(result.status).toBe(401);
    expect(result.error).toBe("Unauthorized");
  });

  it("rejects non-admin users", async () => {
    mockedGetSession.mockResolvedValue({
      user: { id: "1", email: "user@example.com", role: "user" },
    });

    const result = await requireAdminSession();

    expect(result.status).toBe(403);
    expect(result.error).toBe("Forbidden");
  });

  it("allows admin users", async () => {
    const session = {
      user: { id: "1", email: "admin@jkorganics.com", role: "min_admin" },
    };
    mockedGetSession.mockResolvedValue(session);

    const result = await requireAdminSession();

    expect(result.status).toBe(200);
    expect(result.session).toEqual(session);
  });

  it("allows super admin users", async () => {
    const session = {
      user: {
        id: "1",
        email: "owner@jkorganics.com",
        role: "super_admin",
      },
    };
    mockedGetSession.mockResolvedValue(session);

    const result = await requireAdminSession();

    expect(result.status).toBe(200);
    expect(result.session).toEqual(session);
  });
});

describe("requireSuperAdminSession", () => {
  beforeEach(() => {
    mockedGetSession.mockReset();
  });

  it("rejects regular admins", async () => {
    mockedGetSession.mockResolvedValue({
      user: { id: "1", email: "admin@jkorganics.com", role: "min_admin" },
    });

    const result = await requireSuperAdminSession();

    expect(result.status).toBe(403);
  });

  it("allows super admins", async () => {
    const session = {
      user: {
        id: "1",
        email: "owner@jkorganics.com",
        role: "super_admin",
      },
    };
    mockedGetSession.mockResolvedValue(session);

    const result = await requireSuperAdminSession();

    expect(result.status).toBe(200);
    expect(result.session).toEqual(session);
  });
});
