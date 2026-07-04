import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireAdminSession, requireSuperAdminSession } from "./require-admin";
import { isAdminRole, isSuperAdminRole } from "./roles";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/auth/getSession", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { getSession } from "@/lib/auth/getSession";
import prisma from "@/lib/prisma";

const mockedGetSession = vi.mocked(getSession);
const mockedFindUnique = vi.mocked(prisma.user.findUnique);

function mockCurrentUser({
  role = "min_admin",
  disabledAt = null,
  deletedAt = null,
  authVersion = 0,
}: {
  role?: string;
  disabledAt?: Date | null;
  deletedAt?: Date | null;
  authVersion?: number;
} = {}) {
  mockedFindUnique.mockResolvedValue({
    role,
    disabledAt,
    deletedAt,
    authVersion,
  } as never);
}

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
    mockedFindUnique.mockReset();
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
      user: {
        id: "1",
        email: "admin@jkorganics.com",
        role: "min_admin",
        authVersion: 0,
      },
    };
    mockedGetSession.mockResolvedValue(session);
    mockCurrentUser();

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
        authVersion: 0,
      },
    };
    mockedGetSession.mockResolvedValue(session);
    mockCurrentUser({ role: "super_admin" });

    const result = await requireAdminSession();

    expect(result.status).toBe(200);
    expect(result.session).toEqual(session);
  });

  it("rejects disabled admin users", async () => {
    mockedGetSession.mockResolvedValue({
      user: {
        id: "1",
        email: "admin@jkorganics.com",
        role: "min_admin",
        disabledAt: new Date("2026-02-01"),
      },
    });
    mockCurrentUser({ disabledAt: new Date("2026-02-01") });

    const result = await requireAdminSession();

    expect(result.status).toBe(403);
    expect(result.error).toBe("Forbidden");
  });

  it("rejects deleted admin users", async () => {
    mockedGetSession.mockResolvedValue({
      user: {
        id: "1",
        email: "admin@jkorganics.com",
        role: "min_admin",
        deletedAt: new Date("2026-02-01"),
      },
    });
    mockCurrentUser({ deletedAt: new Date("2026-02-01") });

    const result = await requireAdminSession();

    expect(result.status).toBe(403);
    expect(result.error).toBe("Forbidden");
  });

  it("rejects stale admin sessions when the current user is disabled", async () => {
    mockedGetSession.mockResolvedValue({
      user: {
        id: "1",
        email: "admin@jkorganics.com",
        role: "min_admin",
      },
    });
    mockCurrentUser({ disabledAt: new Date("2026-02-01") });

    const result = await requireAdminSession();

    expect(mockedFindUnique).toHaveBeenCalledWith({
      where: { id: "1" },
      select: {
        role: true,
        disabledAt: true,
        deletedAt: true,
        authVersion: true,
      },
    });
    expect(result.status).toBe(403);
    expect(result.error).toBe("Forbidden");
  });

  it("rejects stale admin sessions when the current user is deleted", async () => {
    mockedGetSession.mockResolvedValue({
      user: {
        id: "1",
        email: "admin@jkorganics.com",
        role: "min_admin",
      },
    });
    mockCurrentUser({ deletedAt: new Date("2026-02-01") });

    const result = await requireAdminSession();

    expect(result.status).toBe(403);
    expect(result.error).toBe("Forbidden");
  });

  it("rejects stale admin sessions when authVersion changed", async () => {
    mockedGetSession.mockResolvedValue({
      user: {
        id: "1",
        email: "admin@jkorganics.com",
        role: "min_admin",
        authVersion: 1,
      },
    });
    mockCurrentUser({ authVersion: 2 });

    const result = await requireAdminSession();

    expect(result.status).toBe(403);
    expect(result.error).toBe("Forbidden");
  });
});

describe("requireSuperAdminSession", () => {
  beforeEach(() => {
    mockedGetSession.mockReset();
    mockedFindUnique.mockReset();
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
        authVersion: 0,
      },
    };
    mockedGetSession.mockResolvedValue(session);
    mockCurrentUser({ role: "super_admin" });

    const result = await requireSuperAdminSession();

    expect(result.status).toBe(200);
    expect(result.session).toEqual(session);
  });

  it("rejects disabled super admins", async () => {
    mockedGetSession.mockResolvedValue({
      user: {
        id: "1",
        email: "owner@jkorganics.com",
        role: "super_admin",
        disabledAt: new Date("2026-02-01"),
      },
    });
    mockCurrentUser({
      role: "super_admin",
      disabledAt: new Date("2026-02-01"),
    });

    const result = await requireSuperAdminSession();

    expect(result.status).toBe(403);
    expect(result.error).toBe("Forbidden");
  });

  it("rejects deleted super admins", async () => {
    mockedGetSession.mockResolvedValue({
      user: {
        id: "1",
        email: "owner@jkorganics.com",
        role: "super_admin",
        deletedAt: new Date("2026-02-01"),
      },
    });
    mockCurrentUser({
      role: "super_admin",
      deletedAt: new Date("2026-02-01"),
    });

    const result = await requireSuperAdminSession();

    expect(result.status).toBe(403);
    expect(result.error).toBe("Forbidden");
  });

  it("rejects stale super admin sessions when the current user is disabled", async () => {
    mockedGetSession.mockResolvedValue({
      user: {
        id: "1",
        email: "owner@jkorganics.com",
        role: "super_admin",
      },
    });
    mockCurrentUser({
      role: "super_admin",
      disabledAt: new Date("2026-02-01"),
    });

    const result = await requireSuperAdminSession();

    expect(mockedFindUnique).toHaveBeenCalledWith({
      where: { id: "1" },
      select: {
        role: true,
        disabledAt: true,
        deletedAt: true,
        authVersion: true,
      },
    });
    expect(result.status).toBe(403);
    expect(result.error).toBe("Forbidden");
  });

  it("rejects stale super admin sessions when the current user is deleted", async () => {
    mockedGetSession.mockResolvedValue({
      user: {
        id: "1",
        email: "owner@jkorganics.com",
        role: "super_admin",
      },
    });
    mockCurrentUser({
      role: "super_admin",
      deletedAt: new Date("2026-02-01"),
    });

    const result = await requireSuperAdminSession();

    expect(result.status).toBe(403);
    expect(result.error).toBe("Forbidden");
  });

  it("rejects stale super admin sessions when authVersion changed", async () => {
    mockedGetSession.mockResolvedValue({
      user: {
        id: "1",
        email: "owner@jkorganics.com",
        role: "super_admin",
        authVersion: 1,
      },
    });
    mockCurrentUser({
      role: "super_admin",
      authVersion: 2,
    });

    const result = await requireSuperAdminSession();

    expect(result.status).toBe(403);
    expect(result.error).toBe("Forbidden");
  });
});
