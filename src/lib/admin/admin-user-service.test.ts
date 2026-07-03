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
        targetUserId: "u1",
        targetRole: "min_admin",
        activeSuperAdminCount: 1,
      }).allowed,
    ).toBe(true);

    expect(
      canManageAdminTarget({
        action: "delete",
        actingUserId: "u2",
        targetUserId: "u1",
        targetRole: "min_admin",
        activeSuperAdminCount: 1,
      }).allowed,
    ).toBe(true);
  });
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
