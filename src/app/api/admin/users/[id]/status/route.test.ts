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
import { PATCH } from "./route";

const mockedRequireSuperAdminSession = vi.mocked(requireSuperAdminSession);
const mockedPrisma = vi.mocked(prisma);

describe("PATCH /api/admin/users/[id]/status", () => {
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

  it("blocks a regular admin", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: "admin-1",
      role: "min_admin",
    } as never);
    mockedPrisma.user.count.mockResolvedValue(1 as never);
    mockedPrisma.user.update.mockResolvedValue({ id: "admin-1" } as never);

    const response = await PATCH(
      new Request("http://test.local/api/admin/users/admin-1/status", {
        method: "PATCH",
        body: JSON.stringify({ disabled: true }),
      }),
      { params: Promise.resolve({ id: "admin-1" }) },
    );

    expect(response.status).toBe(200);
    expect(mockedPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { disabledAt: expect.any(Date) },
      }),
    );
  });

  it("unblocks a regular admin", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: "admin-1",
      role: "min_admin",
    } as never);
    mockedPrisma.user.count.mockResolvedValue(1 as never);
    mockedPrisma.user.update.mockResolvedValue({ id: "admin-1" } as never);

    const response = await PATCH(
      new Request("http://test.local/api/admin/users/admin-1/status", {
        method: "PATCH",
        body: JSON.stringify({ disabled: false }),
      }),
      { params: Promise.resolve({ id: "admin-1" }) },
    );

    expect(response.status).toBe(200);
    expect(mockedPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { disabledAt: null },
      }),
    );
  });

  it("does not block the last active super admin", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: "super-2",
      role: "super_admin",
    } as never);
    mockedPrisma.user.count.mockResolvedValue(1 as never);

    const response = await PATCH(
      new Request("http://test.local/api/admin/users/super-2/status", {
        method: "PATCH",
        body: JSON.stringify({ disabled: true }),
      }),
      { params: Promise.resolve({ id: "super-2" }) },
    );

    expect(response.status).toBe(400);
    expect(mockedPrisma.user.update).not.toHaveBeenCalled();
  });
});
