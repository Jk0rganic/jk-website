import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/admin/require-admin", () => ({
  requireSuperAdminSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      count: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(),
  },
}));

import bcrypt from "bcryptjs";
import { requireSuperAdminSession } from "@/lib/admin/require-admin";
import type { Session } from "@/lib/auth/getSession";
import prisma from "@/lib/prisma";
import { GET, POST } from "./route";

const mockedRequireSuperAdminSession = vi.mocked(requireSuperAdminSession);
const mockedUserCount = vi.mocked(prisma.user.count);
const mockedUserCreate = vi.mocked(prisma.user.create);
const mockedUserFindMany = vi.mocked(prisma.user.findMany);
const mockedUserFindUnique = vi.mocked(prisma.user.findUnique);
const mockedUserUpdate = vi.mocked(prisma.user.update);
const mockedHash = vi.mocked(bcrypt.hash);

const superAdminSession: Session = {
  user: {
    id: "super-1",
    email: "owner@jkorganics.com",
    role: "super_admin",
  },
};

describe("GET /api/admin/users", () => {
  beforeEach(() => {
    mockedRequireSuperAdminSession.mockReset();
    mockedUserCount.mockReset();
    mockedUserFindMany.mockReset();
    mockedRequireSuperAdminSession.mockResolvedValue({
      error: null,
      status: 200,
      session: superAdminSession,
    });
  });

  it("requires a super admin session", async () => {
    mockedRequireSuperAdminSession.mockResolvedValue({
      error: "Forbidden",
      status: 403,
      session: null,
    });

    const response = await GET();

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Forbidden" });
    expect(mockedUserFindMany).not.toHaveBeenCalled();
  });

  it("excludes deleted admins and maps status fields with action booleans", async () => {
    const disabledAt = new Date("2026-02-01T00:00:00.000Z");
    mockedUserFindMany.mockResolvedValue([
      {
        id: "admin-1",
        name: "Admin One",
        email: "admin1@example.com",
        role: "min_admin",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        disabledAt,
        deletedAt: null,
      },
      {
        id: "super-2",
        name: "Second Owner",
        email: "owner2@example.com",
        role: "super_admin",
        createdAt: new Date("2026-01-02T00:00:00.000Z"),
        disabledAt: null,
        deletedAt: null,
      },
    ] as never);
    mockedUserCount.mockResolvedValue(2);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(mockedUserFindMany).toHaveBeenCalledWith({
      where: {
        role: { in: ["min_admin", "super_admin"] },
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        disabledAt: true,
        deletedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    expect(mockedUserCount).toHaveBeenCalledWith({
      where: {
        role: "super_admin",
        disabledAt: null,
        deletedAt: null,
      },
    });
    expect(await response.json()).toEqual({
      users: [
        expect.objectContaining({
          id: "admin-1",
          disabledAt: disabledAt.toISOString(),
          deletedAt: null,
          isDisabled: true,
          isDeleted: false,
          statusLabel: "Disabled",
          canBlock: false,
          canUnblock: true,
          canResetPassword: true,
          canDelete: true,
          canDemote: true,
          canRemove: true,
        }),
        expect.objectContaining({
          id: "super-2",
          statusLabel: "Active",
          canDelete: true,
          canDemote: true,
        }),
      ],
    });
  });

  it("allows delete and demote actions for disabled super admin targets", async () => {
    const disabledAt = new Date("2026-02-01T00:00:00.000Z");
    mockedUserFindMany.mockResolvedValue([
      {
        id: "super-2",
        name: "Disabled Owner",
        email: "disabled-owner@example.com",
        role: "super_admin",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        disabledAt,
        deletedAt: null,
      },
    ] as never);
    mockedUserCount.mockResolvedValue(1);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      users: [
        expect.objectContaining({
          id: "super-2",
          isDisabled: true,
          canBlock: false,
          canUnblock: true,
          canDelete: true,
          canDemote: true,
        }),
      ],
    });
  });

  it("returns a stable error and logs internal fetch failures", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mockedUserFindMany.mockRejectedValue(new Error("private database detail"));
    mockedUserCount.mockResolvedValue(1);

    const response = await GET();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to fetch admin users",
    });
    expect(consoleError).toHaveBeenCalledWith(
      "[ADMIN_USERS_GET_ERROR]",
      expect.any(Error),
    );

    consoleError.mockRestore();
  });
});

describe("POST /api/admin/users", () => {
  beforeEach(() => {
    mockedRequireSuperAdminSession.mockReset();
    mockedUserCreate.mockReset();
    mockedUserFindUnique.mockReset();
    mockedUserUpdate.mockReset();
    mockedHash.mockReset();
    mockedRequireSuperAdminSession.mockResolvedValue({
      error: null,
      status: 200,
      session: superAdminSession,
    });
    mockedHash.mockResolvedValue("hashed-password" as never);
  });

  it("rejects an email that belongs to a soft-deleted account", async () => {
    mockedUserFindUnique.mockResolvedValue({
      id: "deleted-1",
      role: "user",
      deletedAt: new Date("2026-03-01T00:00:00.000Z"),
    } as never);

    const response = await POST(
      new Request("http://test.local/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          name: "Deleted User",
          email: "deleted@example.com",
          password: "password123",
          confirmPassword: "password123",
        }),
      }),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "This email belongs to an inactive account",
    });
    expect(mockedUserUpdate).not.toHaveBeenCalled();
  });

  it("sets status fields when promoting an existing customer", async () => {
    mockedUserFindUnique.mockResolvedValue({
      id: "customer-1",
      role: "user",
      deletedAt: null,
    } as never);
    mockedUserUpdate.mockResolvedValue({
      id: "customer-1",
      name: "Customer One",
      email: "customer@example.com",
      role: "min_admin",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      disabledAt: null,
      deletedAt: null,
    } as never);

    const response = await POST(
      new Request("http://test.local/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          name: "Customer One",
          email: "customer@example.com",
          password: "password123",
          confirmPassword: "password123",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mockedUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          role: "min_admin",
          disabledAt: null,
          deletedAt: null,
        }),
      }),
    );
  });

  it("sets status fields when creating an admin", async () => {
    mockedUserFindUnique.mockResolvedValue(null);
    mockedUserCreate.mockResolvedValue({
      id: "admin-1",
      name: "Admin One",
      email: "admin@example.com",
      role: "min_admin",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      disabledAt: null,
      deletedAt: null,
    } as never);

    const response = await POST(
      new Request("http://test.local/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          name: "Admin One",
          email: "admin@example.com",
          password: "password123",
          confirmPassword: "password123",
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(mockedUserCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          role: "min_admin",
          disabledAt: null,
          deletedAt: null,
        }),
      }),
    );
  });
});
