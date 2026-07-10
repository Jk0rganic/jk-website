import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/admin/require-admin", () => ({
  requireSuperAdminSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      count: vi.fn(),
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
import { PATCH } from "./route";

const mockedRequireSuperAdminSession = vi.mocked(requireSuperAdminSession);
const mockedPrisma = vi.mocked(prisma);
const mockedBcrypt = vi.mocked(bcrypt);

describe("PATCH /api/admin/users/[id]/password", () => {
  beforeEach(() => {
    mockedRequireSuperAdminSession.mockReset();
    mockedPrisma.user.count.mockReset();
    mockedPrisma.user.findUnique.mockReset();
    mockedPrisma.user.update.mockReset();
    mockedBcrypt.hash.mockReset();
    mockedRequireSuperAdminSession.mockResolvedValue({
      error: null,
      status: 200,
      session: {
        user: { id: "super-1", email: "owner@jk.test", role: "super_admin" },
      },
    });
  });

  it("rejects invalid password payloads", async () => {
    const response = await PATCH(
      new Request("http://test.local/api/admin/users/admin-1/password", {
        method: "PATCH",
        body: JSON.stringify({
          password: "short",
          confirmPassword: "different",
        }),
      }),
      { params: Promise.resolve({ id: "admin-1" }) },
    );

    expect(response.status).toBe(400);
    expect(mockedPrisma.user.update).not.toHaveBeenCalled();
  });

  it("resets a target admin password with a hash", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: "admin-1",
      role: "min_admin",
    } as never);
    mockedPrisma.user.count.mockResolvedValue(1 as never);
    mockedBcrypt.hash.mockResolvedValue("hashed-new-password" as never);
    mockedPrisma.user.update.mockResolvedValue({ id: "admin-1" } as never);

    const response = await PATCH(
      new Request("http://test.local/api/admin/users/admin-1/password", {
        method: "PATCH",
        body: JSON.stringify({
          password: "newpass123",
          confirmPassword: "newpass123",
        }),
      }),
      { params: Promise.resolve({ id: "admin-1" }) },
    );

    expect(response.status).toBe(200);
    expect(mockedBcrypt.hash).toHaveBeenCalledWith("newpass123", 10);
    expect(mockedPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "admin-1" },
      data: { password: "hashed-new-password" },
      select: { id: true },
    });
  });
});
