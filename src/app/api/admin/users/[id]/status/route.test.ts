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
import { PATCH } from "./route";

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

describe("PATCH /api/admin/users/[id]/status", () => {
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

  it("validates status payloads", async () => {
    const response = await PATCH(
      new Request("http://test.local", {
        method: "PATCH",
        body: JSON.stringify({ disabled: "true" }),
      }),
      { params: Promise.resolve({ id: "admin-1" }) },
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: "Invalid status data",
    });
    expect(mockedUserFindUnique).not.toHaveBeenCalled();
  });

  it("blocks a regular admin and clears sessions", async () => {
    mockedUserFindUnique.mockResolvedValue({
      id: "admin-1",
      role: "min_admin",
      deletedAt: null,
    } as never);
    mockedUserCount.mockResolvedValue(1);
    mockedUserUpdate.mockResolvedValue({
      id: "admin-1",
      name: "Admin One",
      email: "admin@example.com",
      role: "min_admin",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      disabledAt: new Date("2026-04-01T00:00:00.000Z"),
      deletedAt: null,
    } as never);

    const response = await PATCH(
      new Request("http://test.local", {
        method: "PATCH",
        body: JSON.stringify({ disabled: true }),
      }),
      { params: Promise.resolve({ id: "admin-1" }) },
    );

    expect(response.status).toBe(200);
    expect(mockedUserUpdate).toHaveBeenCalledWith({
      where: { id: "admin-1" },
      data: { disabledAt: expect.any(Date) },
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
  });

  it("unblocks a regular admin", async () => {
    mockedUserFindUnique.mockResolvedValue({
      id: "admin-1",
      role: "min_admin",
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
      deletedAt: null,
    } as never);

    const response = await PATCH(
      new Request("http://test.local", {
        method: "PATCH",
        body: JSON.stringify({ disabled: false }),
      }),
      { params: Promise.resolve({ id: "admin-1" }) },
    );

    expect(response.status).toBe(200);
    expect(mockedUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { disabledAt: null } }),
    );
    expect(mockedSessionDeleteMany).not.toHaveBeenCalled();
  });

  it("rejects self-management", async () => {
    const response = await PATCH(
      new Request("http://test.local", {
        method: "PATCH",
        body: JSON.stringify({ disabled: true }),
      }),
      { params: Promise.resolve({ id: "super-1" }) },
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "You cannot manage your own admin account",
    });
  });

  it("rejects disabling the last active super admin", async () => {
    mockedUserFindUnique.mockResolvedValue({
      id: "super-2",
      role: "super_admin",
      deletedAt: null,
    } as never);
    mockedUserCount.mockResolvedValue(1);

    const response = await PATCH(
      new Request("http://test.local", {
        method: "PATCH",
        body: JSON.stringify({ disabled: true }),
      }),
      { params: Promise.resolve({ id: "super-2" }) },
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "At least one super admin must remain on the account",
    });
    expect(mockedUserUpdate).not.toHaveBeenCalled();
  });

  it("allows disabling an already-disabled super admin target", async () => {
    mockedUserFindUnique.mockResolvedValue({
      id: "super-2",
      role: "super_admin",
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
      disabledAt: new Date("2026-04-01T00:00:00.000Z"),
      deletedAt: null,
    } as never);

    const response = await PATCH(
      new Request("http://test.local", {
        method: "PATCH",
        body: JSON.stringify({ disabled: true }),
      }),
      { params: Promise.resolve({ id: "super-2" }) },
    );

    expect(response.status).toBe(200);
    expect(mockedUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { disabledAt: expect.any(Date) },
      }),
    );
    expect(mockedSessionDeleteMany).toHaveBeenCalledWith({
      where: { userId: "super-2" },
    });
  });

  it("rejects missing or soft-deleted targets", async () => {
    mockedUserFindUnique.mockResolvedValueOnce(null);

    const missingResponse = await PATCH(
      new Request("http://test.local", {
        method: "PATCH",
        body: JSON.stringify({ disabled: true }),
      }),
      { params: Promise.resolve({ id: "missing-1" }) },
    );

    expect(missingResponse.status).toBe(404);
    expect(await missingResponse.json()).toEqual({ error: "User not found" });

    mockedUserFindUnique.mockResolvedValueOnce({
      id: "admin-1",
      role: "min_admin",
      deletedAt: new Date("2026-04-01T00:00:00.000Z"),
    } as never);

    const deletedResponse = await PATCH(
      new Request("http://test.local", {
        method: "PATCH",
        body: JSON.stringify({ disabled: true }),
      }),
      { params: Promise.resolve({ id: "admin-1" }) },
    );

    expect(deletedResponse.status).toBe(404);
    expect(await deletedResponse.json()).toEqual({ error: "User not found" });
  });
});
