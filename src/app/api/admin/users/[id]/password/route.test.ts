import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/admin/require-admin", () => ({
  requireSuperAdminSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
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
import { PATCH } from "./route";

const mockedRequireSuperAdminSession = vi.mocked(requireSuperAdminSession);
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

describe("PATCH /api/admin/users/[id]/password", () => {
  beforeEach(() => {
    mockedRequireSuperAdminSession.mockReset();
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

  it("requires a super admin session", async () => {
    mockedRequireSuperAdminSession.mockResolvedValue({
      error: "Forbidden",
      status: 403,
      session: null,
    });

    const response = await PATCH(
      new Request("http://test.local", {
        method: "PATCH",
        body: JSON.stringify({
          password: "password123",
          confirmPassword: "password123",
        }),
      }),
      { params: Promise.resolve({ id: "admin-1" }) },
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Forbidden" });
  });

  it("validates reset password payloads", async () => {
    const response = await PATCH(
      new Request("http://test.local", {
        method: "PATCH",
        body: JSON.stringify({
          password: "password123",
          confirmPassword: "different123",
        }),
      }),
      { params: Promise.resolve({ id: "admin-1" }) },
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: "Invalid password data",
    });
    expect(mockedUserFindUnique).not.toHaveBeenCalled();
  });

  it("rejects self-management", async () => {
    const response = await PATCH(
      new Request("http://test.local", {
        method: "PATCH",
        body: JSON.stringify({
          password: "password123",
          confirmPassword: "password123",
        }),
      }),
      { params: Promise.resolve({ id: "super-1" }) },
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "You cannot manage your own admin account",
    });
  });

  it("rejects missing or soft-deleted targets", async () => {
    mockedUserFindUnique.mockResolvedValueOnce(null);

    const missingResponse = await PATCH(
      new Request("http://test.local", {
        method: "PATCH",
        body: JSON.stringify({
          password: "password123",
          confirmPassword: "password123",
        }),
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
        body: JSON.stringify({
          password: "password123",
          confirmPassword: "password123",
        }),
      }),
      { params: Promise.resolve({ id: "admin-1" }) },
    );

    expect(deletedResponse.status).toBe(404);
    expect(await deletedResponse.json()).toEqual({ error: "User not found" });
  });

  it("rejects customer targets", async () => {
    mockedUserFindUnique.mockResolvedValue({
      id: "customer-1",
      role: "user",
      deletedAt: null,
    } as never);

    const response = await PATCH(
      new Request("http://test.local", {
        method: "PATCH",
        body: JSON.stringify({
          password: "password123",
          confirmPassword: "password123",
        }),
      }),
      { params: Promise.resolve({ id: "customer-1" }) },
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "This user is not an admin",
    });
    expect(mockedUserUpdate).not.toHaveBeenCalled();
  });

  it("hashes the password and returns safe user data", async () => {
    mockedUserFindUnique.mockResolvedValue({
      id: "admin-1",
      role: "min_admin",
      deletedAt: null,
    } as never);
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
        body: JSON.stringify({
          password: "password123",
          confirmPassword: "password123",
        }),
      }),
      { params: Promise.resolve({ id: "admin-1" }) },
    );

    expect(response.status).toBe(200);
    expect(mockedHash).toHaveBeenCalledWith("password123", 10);
    expect(mockedUserUpdate).toHaveBeenCalledWith({
      where: { id: "admin-1" },
      data: {
        password: "hashed-password",
        authVersion: { increment: 1 },
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
    });
    expect(await response.json()).toEqual({
      user: expect.not.objectContaining({ password: expect.anything() }),
    });
  });

  it("returns a stable error and logs internal reset failures", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mockedUserFindUnique.mockRejectedValue(new Error("database exploded"));

    const response = await PATCH(
      new Request("http://test.local", {
        method: "PATCH",
        body: JSON.stringify({
          password: "password123",
          confirmPassword: "password123",
        }),
      }),
      { params: Promise.resolve({ id: "admin-1" }) },
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to reset admin password",
    });
    expect(consoleError).toHaveBeenCalledWith(
      "[ADMIN_RESET_PASSWORD_ERROR]",
      expect.any(Error),
    );

    consoleError.mockRestore();
  });
});
