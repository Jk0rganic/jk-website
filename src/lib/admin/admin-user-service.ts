import {
  ADMIN_ROLE,
  SUPER_ADMIN_ROLE,
  USER_ROLE,
  getRoleLabel,
} from "./roles";

export type AdminUserRecord = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
};

export type AdminUserListItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
  createdAt: string;
  canRemove: boolean;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  createdAt: Date;
};

export function mapAdminUser(
  user: UserRow,
  _actingUserId: string,
  _superAdminCount: number,
): AdminUserListItem {
  const role = user.role || USER_ROLE;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role,
    roleLabel: getRoleLabel(role),
    createdAt: user.createdAt.toISOString(),
    canRemove: role === ADMIN_ROLE,
  };
}

export function canCreateAdminRole(role: string): role is typeof ADMIN_ROLE {
  return role === ADMIN_ROLE;
}

export function canRevokeAdminRole(
  targetRole: string,
  actingUserId: string,
  targetUserId: string,
  superAdminCount: number,
): { allowed: boolean; reason?: string } {
  if (targetRole === USER_ROLE) {
    return { allowed: false, reason: "This user is already a customer" };
  }

  if (targetRole === SUPER_ADMIN_ROLE) {
    if (targetUserId === actingUserId) {
      return { allowed: false, reason: "You cannot remove your own super admin access" };
    }

    if (superAdminCount <= 1) {
      return {
        allowed: false,
        reason: "At least one super admin must remain on the account",
      };
    }
  }

  return { allowed: true };
}
