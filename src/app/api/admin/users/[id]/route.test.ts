import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/admin/require-admin", () => ({
  requireSuperAdminSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    session: {
      deleteMany: vi.fn(),
    },
    user: {
      count: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { requireSuperAdminSession } from "@/lib/admin/require-admin";
import type { Session } from "@/lib/auth/getSession";
import prisma from "@/lib/prisma";
import { DELETE, PATCH } from "./route";

const mockedRequireSuperAdminSession = vi.mocked(requireSuperAdminSession);
const mockedSessionDeleteMany = vi.mocked(prisma.session.deleteMany);
const mockedUserCount = vi.mocked(prisma.user.count);
const mockedUserFindUnique = vi.mocked(prisma.user.findUnique);
const mockedUserUpdate = vi.mocked(prisma.user.update);

const superAdminSession: Session = {
  user: {
    id: "super-1",
    email: "owner@jkorganics.com",
    role: "super_admin",
  },
};

describe("PATCH /api/admin/users/[id]", () => {
  beforeEach(() => {
    mockedRequireSuperAdminSession.mockReset();
    mockedUserCount.mockReset();
    mockedUserFindUnique.mockReset();
    mockedUserUpdate.mockReset();
    mockedRequireSuperAdminSession.mockResolvedValue({
      error: null,
      status: 200,
      session: superAdminSession,
    });
  });

  it("rejects self-management", async () => {
    const response = await PATCH(new Request("http://test.local"), {
      params: Promise.resolve({ id: "super-1" }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "You cannot change your own admin access here",
    });
    expect(mockedUserFindUnique).not.toHaveBeenCalled();
  });

  it("uses active super admin count and target status when demoting", async () => {
    mockedUserFindUnique.mockResolvedValue({
      id: "super-2",
      role: "super_admin",
      email: "owner2@example.com",
      name: "Owner Two",
      disabledAt: null,
      deletedAt: null,
    } as never);
    mockedUserCount.mockResolvedValue(2);
    mockedUserUpdate.mockResolvedValue({
      id: "super-2",
      name: "Owner Two",
      email: "owner2@example.com",
      role: "user",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      disabledAt: null,
      deletedAt: null,
    } as never);

    const response = await PATCH(new Request("http://test.local"), {
      params: Promise.resolve({ id: "super-2" }),
    });

    expect(response.status).toBe(200);
    expect(mockedUserFindUnique).toHaveBeenCalledWith({
      where: { id: "super-2" },
      select: {
        id: true,
        role: true,
        email: true,
        name: true,
        disabledAt: true,
        deletedAt: true,
      },
    });
    expect(mockedUserCount).toHaveBeenCalledWith({
      where: {
        role: "super_admin",
        disabledAt: null,
        deletedAt: null,
      },
    });
    expect(mockedUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { role: "user" } }),
    );
  });

  it("rejects demoting the last active super admin", async () => {
    mockedUserFindUnique.mockResolvedValue({
      id: "super-2",
      role: "super_admin",
      email: "owner2@example.com",
      name: "Owner Two",
      disabledAt: null,
      deletedAt: null,
    } as never);
    mockedUserCount.mockResolvedValue(1);

    const response = await PATCH(new Request("http://test.local"), {
      params: Promise.resolve({ id: "super-2" }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "At least one super admin must remain on the account",
    });
    expect(mockedUserUpdate).not.toHaveBeenCalled();
  });

  it("demotes a disabled super admin when one active super admin remains", async () => {
    mockedUserFindUnique.mockResolvedValue({
      id: "super-2",
      role: "super_admin",
      email: "owner2@example.com",
      name: "Owner Two",
      disabledAt: new Date("2026-02-01T00:00:00.000Z"),
      deletedAt: null,
    } as never);
    mockedUserCount.mockResolvedValue(1);
    mockedUserUpdate.mockResolvedValue({
      id: "super-2",
      name: "Owner Two",
      email: "owner2@example.com",
      role: "user",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      disabledAt: new Date("2026-02-01T00:00:00.000Z"),
      deletedAt: null,
    } as never);

    const response = await PATCH(new Request("http://test.local"), {
      params: Promise.resolve({ id: "super-2" }),
    });

    expect(response.status).toBe(200);
    expect(mockedUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { role: "user" } }),
    );
  });
});

describe("DELETE /api/admin/users/[id]", () => {
  beforeEach(() => {
    mockedRequireSuperAdminSession.mockReset();
    mockedSessionDeleteMany.mockReset();
    mockedUserCount.mockReset();
    mockedUserFindUnique.mockReset();
    mockedUserUpdate.mockReset();
    mockedRequireSuperAdminSession.mockResolvedValue({
      error: null,
      status: 200,
      session: superAdminSession,
    });
  });

  it("soft-deletes a target user and clears sessions", async () => {
    mockedUserFindUnique.mockResolvedValue({
      id: "admin-1",
      role: "min_admin",
      email: "admin@example.com",
      name: "Admin One",
      disabledAt: null,
      deletedAt: null,
    } as never);
    mockedUserCount.mockResolvedValue(1);
    mockedUserUpdate.mockResolvedValue({
      id: "admin-1",
      name: "Admin One",
      email: "admin@example.com",
      role: "min_admin",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      disabledAt: null,
      deletedAt: new Date("2026-04-01T00:00:00.000Z"),
    } as never);

    const response = await DELETE(new Request("http://test.local"), {
      params: Promise.resolve({ id: "admin-1" }),
    });

    expect(response.status).toBe(200);
    expect(mockedUserUpdate).toHaveBeenCalledWith({
      where: { id: "admin-1" },
      data: { deletedAt: expect.any(Date) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        disabledAt: true,
        deletedAt: true,
      },
    });
    expect(mockedSessionDeleteMany).toHaveBeenCalledWith({
      where: { userId: "admin-1" },
    });
    expect(await response.json()).toEqual({
      user: expect.not.objectContaining({ password: expect.anything() }),
    });
  });

  it("rejects self-management", async () => {
    const response = await DELETE(new Request("http://test.local"), {
      params: Promise.resolve({ id: "super-1" }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "You cannot manage your own admin account",
    });
    expect(mockedUserUpdate).not.toHaveBeenCalled();
  });

  it("rejects deleting the last active super admin", async () => {
    mockedUserFindUnique.mockResolvedValue({
      id: "super-2",
      role: "super_admin",
      email: "owner2@example.com",
      name: "Owner Two",
      disabledAt: null,
      deletedAt: null,
    } as never);
    mockedUserCount.mockResolvedValue(1);

    const response = await DELETE(new Request("http://test.local"), {
      params: Promise.resolve({ id: "super-2" }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "At least one super admin must remain on the account",
    });
    expect(mockedUserUpdate).not.toHaveBeenCalled();
    expect(mockedSessionDeleteMany).not.toHaveBeenCalled();
  });

  it("deletes a disabled super admin when one active super admin remains", async () => {
    mockedUserFindUnique.mockResolvedValue({
      id: "super-2",
      role: "super_admin",
      email: "owner2@example.com",
      name: "Owner Two",
      disabledAt: new Date("2026-02-01T00:00:00.000Z"),
      deletedAt: null,
    } as never);
    mockedUserCount.mockResolvedValue(1);
    mockedUserUpdate.mockResolvedValue({
      id: "super-2",
      name: "Owner Two",
      email: "owner2@example.com",
      role: "super_admin",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      disabledAt: new Date("2026-02-01T00:00:00.000Z"),
      deletedAt: new Date("2026-04-01T00:00:00.000Z"),
    } as never);

    const response = await DELETE(new Request("http://test.local"), {
      params: Promise.resolve({ id: "super-2" }),
    });

    expect(response.status).toBe(200);
    expect(mockedUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { deletedAt: expect.any(Date) },
      }),
    );
    expect(mockedSessionDeleteMany).toHaveBeenCalledWith({
      where: { userId: "super-2" },
    });
  });

  it("rejects missing or already deleted targets", async () => {
    mockedUserFindUnique.mockResolvedValueOnce(null);

    const missingResponse = await DELETE(new Request("http://test.local"), {
      params: Promise.resolve({ id: "missing-1" }),
    });

    expect(missingResponse.status).toBe(404);
    expect(await missingResponse.json()).toEqual({ error: "User not found" });

    mockedUserFindUnique.mockResolvedValueOnce({
      id: "admin-1",
      role: "min_admin",
      deletedAt: new Date("2026-04-01T00:00:00.000Z"),
    } as never);

    const deletedResponse = await DELETE(new Request("http://test.local"), {
      params: Promise.resolve({ id: "admin-1" }),
    });

    expect(deletedResponse.status).toBe(404);
    expect(await deletedResponse.json()).toEqual({ error: "User not found" });
  });
});
