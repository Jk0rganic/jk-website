import { describe, expect, it } from "vitest";
import {
  canManageAdmins,
  getRoleLabel,
  isAdminRole,
  isSuperAdminRole,
} from "./roles";

describe("roles", () => {
  it("identifies super admin", () => {
    expect(isSuperAdminRole("super_admin")).toBe(true);
    expect(isSuperAdminRole("min_admin")).toBe(false);
  });

  it("treats both admin roles as staff", () => {
    expect(isAdminRole("super_admin")).toBe(true);
    expect(isAdminRole("min_admin")).toBe(true);
    expect(isAdminRole("user")).toBe(false);
  });

  it("limits team management to super admins", () => {
    expect(canManageAdmins("super_admin")).toBe(true);
    expect(canManageAdmins("min_admin")).toBe(false);
  });

  it("returns readable role labels", () => {
    expect(getRoleLabel("super_admin")).toBe("Super admin");
    expect(getRoleLabel("min_admin")).toBe("Admin");
    expect(getRoleLabel("user")).toBe("Customer");
  });
});
