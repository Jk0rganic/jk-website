export const SUPER_ADMIN_ROLE = "super_admin" as const;
export const ADMIN_ROLE = "min_admin" as const;
export const STORE_MANAGER_ROLE = "store_manager" as const;
export const USER_ROLE = "user" as const;

export const MANAGEABLE_ADMIN_ROLE = ADMIN_ROLE;

export type AppRole =
  | typeof SUPER_ADMIN_ROLE
  | typeof ADMIN_ROLE
  | typeof STORE_MANAGER_ROLE
  | typeof USER_ROLE;

export function isSuperAdminRole(role: string | undefined | null): boolean {
  return role === SUPER_ADMIN_ROLE;
}

export function isMinAdminRole(role: string | undefined | null): boolean {
  return role === ADMIN_ROLE;
}

export function isStoreManagerRole(role: string | undefined | null): boolean {
  return role === STORE_MANAGER_ROLE;
}

export function isAdminRole(role: string | undefined | null): boolean {
  return (
    isSuperAdminRole(role) || isMinAdminRole(role) || isStoreManagerRole(role)
  );
}

export function isStaffRole(role: string | undefined | null): boolean {
  return isAdminRole(role);
}

export function canManageAdmins(role: string | undefined | null): boolean {
  return isSuperAdminRole(role);
}

export function getRoleLabel(role: string): string {
  switch (role) {
    case SUPER_ADMIN_ROLE:
      return "Super admin";
    case ADMIN_ROLE:
      return "Admin";
    case STORE_MANAGER_ROLE:
      return "Store manager";
    case USER_ROLE:
      return "Customer";
    default:
      return role;
  }
}
