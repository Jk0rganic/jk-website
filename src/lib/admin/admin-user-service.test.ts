import { describe, expect, it } from "vitest";
import {
  adminStatusSchema,
  resetAdminPasswordSchema,
} from "./admin-user-schema";
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
    expect(item.canResetPassword).toBe(true);
    expect(item.canBlock).toBe(true);
    expect(item.canUnblock).toBe(false);
    expect(item.canDelete).toBe(true);
    expect(item.canDemote).toBe(true);
    expect(item.roleLabel).toBe("Admin");
    expect(item.disabledAt).toBeNull();
    expect(item.deletedAt).toBeNull();
    expect(item.isDisabled).toBe(false);
    expect(item.isDeleted).toBe(false);
    expect(item.statusLabel).toBe("Active");
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

  it("exposes action booleans for disabled admins", () => {
    const item = mapAdminUser(
      { ...baseUser, disabledAt: new Date("2026-02-01") },
      "super-1",
      1,
      "super_admin",
    );

    expect(item.canResetPassword).toBe(true);
    expect(item.canBlock).toBe(false);
    expect(item.canUnblock).toBe(true);
    expect(item.canDelete).toBe(true);
    expect(item.canDemote).toBe(true);
  });

  it("blocks action booleans for the last active super admin", () => {
    const item = mapAdminUser(
      { ...baseUser, role: "super_admin" },
      "super-1",
      1,
      "super_admin",
    );

    expect(item.canResetPassword).toBe(true);
    expect(item.canBlock).toBe(false);
    expect(item.canUnblock).toBe(false);
    expect(item.canDelete).toBe(false);
    expect(item.canDemote).toBe(false);
  });

  it("maps disabled and deleted status fields", () => {
    const disabledAt = new Date("2026-02-01");
    const deletedAt = new Date("2026-03-01");
    const item = mapAdminUser(
      { ...baseUser, disabledAt, deletedAt },
      "super-1",
      1,
    );

    expect(item.disabledAt).toBe(disabledAt.toISOString());
    expect(item.deletedAt).toBe(deletedAt.toISOString());
    expect(item.isDisabled).toBe(true);
    expect(item.isDeleted).toBe(true);
    expect(item.statusLabel).toBe("Deleted");
  });
});

describe("canRevokeAdminRole", () => {
  it("blocks self-removal for super admins", () => {
    const result = canRevokeAdminRole("super_admin", "u1", "u1", 2);
    expect(result.allowed).toBe(false);
  });

  it("blocks self-removal for regular admins", () => {
    const result = canRevokeAdminRole("min_admin", "u1", "u1", 2);
    expect(result.allowed).toBe(false);
  });

  it("blocks removing the last active super admin", () => {
    const result = canRevokeAdminRole("super_admin", "u2", "u1", 1);
    expect(result.allowed).toBe(false);
  });

  it("allows removing a super admin when another active super admin remains", () => {
    const result = canRevokeAdminRole("super_admin", "u2", "u1", 2);
    expect(result.allowed).toBe(true);
  });

  it("allows demoting a regular admin", () => {
    const result = canRevokeAdminRole("min_admin", "u2", "u1", 1);
    expect(result.allowed).toBe(true);
  });
});

describe("isActiveAdminUser", () => {
  it("returns true for active admins and super admins", () => {
    expect(isActiveAdminUser({ role: "min_admin", deletedAt: null })).toBe(true);
    expect(isActiveAdminUser({ role: "super_admin", deletedAt: null })).toBe(true);
  });

  it("returns false for customers and deleted admins", () => {
    expect(isActiveAdminUser({ role: "user", deletedAt: null })).toBe(false);
    expect(isActiveAdminUser({ role: "min_admin", deletedAt: new Date() })).toBe(false);
  });
});

describe("canManageAdminTarget", () => {
  it.each(["reset_password", "block", "unblock", "delete", "demote"] as const)(
    "blocks %s self-management",
    (action) => {
      const result = canManageAdminTarget({
        action,
        actingUserId: "u1",
        actingUserRole: "super_admin",
        targetUserId: "u1",
        targetRole: "min_admin",
        activeSuperAdminCount: 2,
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBeDefined();
    },
  );

  it.each(["block", "delete", "demote"] as const)(
    "blocks %s for the last active super admin",
    (action) => {
      const result = canManageAdminTarget({
        action,
        actingUserId: "u2",
        actingUserRole: "super_admin",
        targetUserId: "u1",
        targetRole: "super_admin",
        activeSuperAdminCount: 1,
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("At least one super admin must remain on the account");
    },
  );

  it("allows resetting and deleting a regular admin", () => {
    expect(
      canManageAdminTarget({
        action: "reset_password",
        actingUserId: "u2",
        actingUserRole: "super_admin",
        targetUserId: "u1",
        targetRole: "min_admin",
        activeSuperAdminCount: 1,
      }).allowed,
    ).toBe(true);

    expect(
      canManageAdminTarget({
        action: "delete",
        actingUserId: "u2",
        actingUserRole: "super_admin",
        targetUserId: "u1",
        targetRole: "min_admin",
        activeSuperAdminCount: 1,
      }).allowed,
    ).toBe(true);
  });

  it.each(["reset_password", "block", "unblock", "delete", "demote"] as const)(
    "blocks regular admins from %s management",
    (action) => {
      const result = canManageAdminTarget({
        action,
        actingUserId: "u2",
        actingUserRole: "min_admin",
        targetUserId: "u1",
        targetRole: "min_admin",
        activeSuperAdminCount: 1,
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("Only super admins can manage admin accounts");
    },
  );

  it.each(["reset_password", "block", "unblock", "delete", "demote"] as const)(
    "allows super admins to %s regular admins",
    (action) => {
      const result = canManageAdminTarget({
        action,
        actingUserId: "u2",
        actingUserRole: "super_admin",
        targetUserId: "u1",
        targetRole: "min_admin",
        activeSuperAdminCount: 1,
      });

      expect(result.allowed).toBe(true);
    },
  );
});

describe("admin user schemas", () => {
  it("parses matching reset passwords", () => {
    expect(
      resetAdminPasswordSchema.parse({
        password: "password123",
        confirmPassword: "password123",
      }),
    ).toEqual({
      password: "password123",
      confirmPassword: "password123",
    });
  });

  it("rejects short or mismatched reset passwords", () => {
    expect(() =>
      resetAdminPasswordSchema.parse({
        password: "short",
        confirmPassword: "short",
      }),
    ).toThrow();

    expect(() =>
      resetAdminPasswordSchema.parse({
        password: "password123",
        confirmPassword: "different123",
      }),
    ).toThrow();
  });

  it("parses admin disabled status updates", () => {
    expect(adminStatusSchema.parse({ disabled: true })).toEqual({ disabled: true });
    expect(adminStatusSchema.parse({ disabled: false })).toEqual({ disabled: false });
  });

  it("rejects non-boolean admin status updates", () => {
    expect(() => adminStatusSchema.parse({ disabled: "true" })).toThrow();
  });
});
