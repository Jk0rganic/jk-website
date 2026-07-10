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

import { requireSuperAdminSession } from "@/lib/admin/require-admin";
import prisma from "@/lib/prisma";
import { DELETE, PATCH } from "./route";

const mockedRequireSuperAdminSession = vi.mocked(requireSuperAdminSession);
const mockedPrisma = vi.mocked(prisma);

describe("/api/admin/users/[id]", () => {
  beforeEach(() => {
    mockedRequireSuperAdminSession.mockReset();
    mockedPrisma.user.count.mockReset();
    mockedPrisma.user.findUnique.mockReset();
    mockedPrisma.user.update.mockReset();
    mockedRequireSuperAdminSession.mockResolvedValue({
      error: null,
      status: 200,
      session: {
        user: { id: "super-1", email: "owner@jk.test", role: "super_admin" },
      },
    });
  });

  it("demotes an admin using active super admin count", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: "admin-1",
      role: "min_admin",
    } as never);
    mockedPrisma.user.count.mockResolvedValue(1 as never);
    mockedPrisma.user.update.mockResolvedValue({
      id: "admin-1",
      role: "user",
    } as never);

    const response = await PATCH(
      new Request("http://test.local/api/admin/users/admin-1", {
        method: "PATCH",
      }),
      { params: Promise.resolve({ id: "admin-1" }) },
    );

    expect(response.status).toBe(200);
    expect(mockedPrisma.user.count).toHaveBeenCalledWith({
      where: {
        role: "super_admin",
        disabledAt: null,
        deletedAt: null,
      },
    });
  });

  it("soft deletes a regular admin", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: "admin-1",
      role: "min_admin",
    } as never);
    mockedPrisma.user.count.mockResolvedValue(1 as never);
    mockedPrisma.user.update.mockResolvedValue({
      id: "admin-1",
      deletedAt: new Date("2026-07-09"),
    } as never);

    const response = await DELETE(
      new Request("http://test.local/api/admin/users/admin-1", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: "admin-1" }) },
    );

    expect(response.status).toBe(200);
    expect(mockedPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          deletedAt: expect.any(Date),
          disabledAt: expect.any(Date),
        },
      }),
    );
  });
});
