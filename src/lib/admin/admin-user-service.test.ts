import { describe, expect, it } from "vitest";
import {
  canManageAdminTarget,
  canRevokeAdminRole,
  isActiveAdminUser,
  mapAdminUser,
} from "./admin-user-service";

describe("mapAdminUser", () => {
  const baseUser = {
    id: "u1",
    name: "Jane",
    email: "jane@example.com",
    role: "min_admin",
    createdAt: new Date("2026-01-01"),
    disabledAt: null,
    deletedAt: null,
  };

  it("marks regular admins as removable", () => {
    const item = mapAdminUser(baseUser, "super-1", 1);
    expect(item.canRemove).toBe(true);
    expect(item.roleLabel).toBe("Admin");
  });

  it("does not allow removing super admins from the UI list", () => {
    const item = mapAdminUser(
      { ...baseUser, role: "super_admin" },
      "super-1",
      1,
    );
    expect(item.canRemove).toBe(false);
    expect(item.roleLabel).toBe("Super admin");
  });

  it("marks disabled admins as blocked and unavailable for block actions", () => {
    const item = mapAdminUser(
      { ...baseUser, disabledAt: new Date("2026-02-01") },
      "super-1",
      1,
    );

    expect(item.status).toBe("blocked");
    expect(item.statusLabel).toBe("Blocked");
    expect(item.canBlock).toBe(false);
    expect(item.canUnblock).toBe(true);
  });

  it("blocks all row actions against the acting admin", () => {
    const item = mapAdminUser(baseUser, "u1", 1);

    expect(item.canRemove).toBe(false);
    expect(item.canResetPassword).toBe(false);
    expect(item.canBlock).toBe(false);
    expect(item.canUnblock).toBe(false);
    expect(item.canDelete).toBe(false);
  });
});

describe("canRevokeAdminRole", () => {
  it("blocks self-removal for super admins", () => {
    const result = canRevokeAdminRole("super_admin", "u1", "u1", 2);
    expect(result.allowed).toBe(false);
  });

  it("blocks removing the last super admin", () => {
    const result = canRevokeAdminRole("super_admin", "u2", "u1", 1);
    expect(result.allowed).toBe(false);
  });

  it("allows demoting a regular admin", () => {
    const result = canRevokeAdminRole("min_admin", "u2", "u1", 1);
    expect(result.allowed).toBe(true);
  });
});

describe("isActiveAdminUser", () => {
  it("includes staff admins that have not been soft deleted", () => {
    expect(isActiveAdminUser({ role: "super_admin" })).toBe(true);
    expect(isActiveAdminUser({ role: "min_admin" })).toBe(true);
  });

  it("excludes customers and soft-deleted admins", () => {
    expect(isActiveAdminUser({ role: "user" })).toBe(false);
    expect(
      isActiveAdminUser({
        role: "super_admin",
        deletedAt: new Date("2026-02-01"),
      }),
    ).toBe(false);
  });
});

describe("canManageAdminTarget", () => {
  it("blocks actions against the acting admin", () => {
    const result = canManageAdminTarget({
      action: "reset_password",
      actingUserId: "u1",
      targetUserId: "u1",
      targetRole: "min_admin",
      activeSuperAdminCount: 2,
    });

    expect(result.allowed).toBe(false);
  });

  it("blocks disabling or deleting the last active super admin", () => {
    for (const action of ["block", "delete", "demote"] as const) {
      const result = canManageAdminTarget({
        action,
        actingUserId: "u2",
        targetUserId: "u1",
        targetRole: "super_admin",
        activeSuperAdminCount: 1,
      });

      expect(result.allowed).toBe(false);
    }
  });

  it("allows super admin to reset a regular admin password", () => {
    const result = canManageAdminTarget({
      action: "reset_password",
      actingUserId: "u2",
      targetUserId: "u1",
      targetRole: "min_admin",
      activeSuperAdminCount: 1,
    });

    expect(result.allowed).toBe(true);
  });

  it("allows soft-deleting a regular admin", () => {
    const result = canManageAdminTarget({
      action: "delete",
      actingUserId: "u2",
      targetUserId: "u1",
      targetRole: "min_admin",
      activeSuperAdminCount: 1,
    });

    expect(result.allowed).toBe(true);
  });
});
