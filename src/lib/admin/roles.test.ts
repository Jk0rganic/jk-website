import { describe, expect, it } from "vitest";
import {
  canManageAdmins,
  getRoleLabel,
  isAdminRole,
  isStaffRole,
  isStoreManagerRole,
  isSuperAdminRole,
} from "./roles";

describe("roles", () => {
  it("identifies super admin", () => {
    expect(isSuperAdminRole("super_admin")).toBe(true);
    expect(isSuperAdminRole("min_admin")).toBe(false);
  });

  it("identifies store manager", () => {
    expect(isStoreManagerRole("store_manager")).toBe(true);
    expect(isStoreManagerRole("min_admin")).toBe(false);
    expect(isStoreManagerRole("user")).toBe(false);
  });

  it("treats all three staff roles as admin", () => {
    expect(isAdminRole("super_admin")).toBe(true);
    expect(isAdminRole("min_admin")).toBe(true);
    expect(isAdminRole("store_manager")).toBe(true);
    expect(isAdminRole("user")).toBe(false);
  });

  it("treats all three staff roles as staff", () => {
    expect(isStaffRole("super_admin")).toBe(true);
    expect(isStaffRole("min_admin")).toBe(true);
    expect(isStaffRole("store_manager")).toBe(true);
    expect(isStaffRole("user")).toBe(false);
  });

  it("limits team management to super admins", () => {
    expect(canManageAdmins("super_admin")).toBe(true);
    expect(canManageAdmins("min_admin")).toBe(false);
    expect(canManageAdmins("store_manager")).toBe(false);
  });

  it("returns readable role labels", () => {
    expect(getRoleLabel("super_admin")).toBe("Super admin");
    expect(getRoleLabel("min_admin")).toBe("Admin");
    expect(getRoleLabel("store_manager")).toBe("Store manager");
    expect(getRoleLabel("user")).toBe("Customer");
  });
});
