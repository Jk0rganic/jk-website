import { describe, expect, it } from "vitest";
import {
  canRevokeAdminRole,
  mapAdminUser,
} from "./admin-user-service";

describe("mapAdminUser", () => {
  const baseUser = {
    id: "u1",
    name: "Jane",
    email: "jane@example.com",
    role: "min_admin",
    createdAt: new Date("2026-01-01"),
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
