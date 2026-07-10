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
import prisma from "@/lib/prisma";
import { GET, POST } from "./route";

const mockedRequireSuperAdminSession = vi.mocked(requireSuperAdminSession);
const mockedPrisma = vi.mocked(prisma);
const mockedBcrypt = vi.mocked(bcrypt);

const superAdminSession = {
  user: { id: "super-1", email: "owner@jk.test", role: "super_admin" },
};

describe("/api/admin/users", () => {
  beforeEach(() => {
    mockedRequireSuperAdminSession.mockReset();
    mockedPrisma.user.count.mockReset();
    mockedPrisma.user.create.mockReset();
    mockedPrisma.user.findMany.mockReset();
    mockedPrisma.user.findUnique.mockReset();
    mockedPrisma.user.update.mockReset();
    mockedBcrypt.hash.mockReset();
    mockedRequireSuperAdminSession.mockResolvedValue({
      error: null,
      status: 200,
      session: superAdminSession,
    });
  });

  it("lists active admins and excludes soft-deleted users", async () => {
    mockedPrisma.user.findMany.mockResolvedValue([
      adminUser({ id: "admin-1", role: "min_admin" }),
      adminUser({
        id: "super-1",
        role: "super_admin",
        disabledAt: new Date("2026-07-01"),
      }),
    ] as never);
    mockedPrisma.user.count.mockResolvedValue(1 as never);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(mockedPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ deletedAt: null }),
      }),
    );
    expect(mockedPrisma.user.count).toHaveBeenCalledWith({
      where: {
        role: "super_admin",
        disabledAt: null,
        deletedAt: null,
      },
    });
    expect(await response.json()).toEqual({
      users: [
        expect.objectContaining({ id: "admin-1", status: "active" }),
        expect.objectContaining({ id: "super-1", status: "blocked" }),
      ],
    });
  });

  it("reactivates an existing customer when promoting to admin", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(
      adminUser({
        id: "user-1",
        role: "user",
        disabledAt: new Date("2026-07-01"),
        deletedAt: new Date("2026-07-02"),
      }) as never,
    );
    mockedBcrypt.hash.mockResolvedValue("hashed-password" as never);
    mockedPrisma.user.update.mockResolvedValue(
      adminUser({ id: "user-1", role: "min_admin" }) as never,
    );

    const response = await POST(
      new Request("http://test.local/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          name: "Admin User",
          email: "admin@jk.test",
          password: "password123",
          confirmPassword: "password123",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(mockedPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          disabledAt: null,
          deletedAt: null,
          role: "min_admin",
        }),
      }),
    );
  });
});

function adminUser(
  overrides: Partial<{
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: Date;
    disabledAt: Date | null;
    deletedAt: Date | null;
  }> = {},
) {
  return {
    id: "admin-1",
    name: "Admin User",
    email: "admin@jk.test",
    role: "min_admin",
    createdAt: new Date("2026-01-01"),
    disabledAt: null,
    deletedAt: null,
    ...overrides,
  };
}
