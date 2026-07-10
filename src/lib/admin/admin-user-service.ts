import {
  ADMIN_ROLE,
  getRoleLabel,
  isAdminRole,
  SUPER_ADMIN_ROLE,
  USER_ROLE,
} from "./roles";

export type AdminUserRecord = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  disabledAt?: Date | null;
  deletedAt?: Date | null;
};

export type AdminUserStatus = "active" | "blocked";

export type AdminUserListItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
  createdAt: string;
  status: AdminUserStatus;
  statusLabel: string;
  canRemove: boolean;
  canResetPassword: boolean;
  canBlock: boolean;
  canUnblock: boolean;
  canDelete: boolean;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  createdAt: Date;
  disabledAt?: Date | null;
  deletedAt?: Date | null;
};

type AdminTargetAction =
  | "reset_password"
  | "block"
  | "unblock"
  | "delete"
  | "demote";

export function isActiveAdminUser(user: {
  role: string | null;
  deletedAt?: Date | null;
}) {
  const role = user.role || USER_ROLE;
  return isAdminRole(role) && !user.deletedAt;
}

export function canManageAdminTarget(args: {
  action: AdminTargetAction;
  actingUserId: string;
  targetUserId: string;
  targetRole: string;
  activeSuperAdminCount: number;
}): { allowed: boolean; reason?: string } {
  if (args.targetUserId === args.actingUserId) {
    return {
      allowed: false,
      reason: "You cannot manage your own admin account here",
    };
  }

  if (
    args.targetRole === SUPER_ADMIN_ROLE &&
    ["block", "delete", "demote"].includes(args.action) &&
    args.activeSuperAdminCount <= 1
  ) {
    return {
      allowed: false,
      reason: "At least one active super admin must remain on the account",
    };
  }

  return { allowed: true };
}

export function mapAdminUser(
  user: UserRow,
  _actingUserId: string,
  _superAdminCount: number,
): AdminUserListItem {
  const role = user.role || USER_ROLE;
  const status: AdminUserStatus = user.disabledAt ? "blocked" : "active";
  const resetCheck = canManageAdminTarget({
    action: "reset_password",
    actingUserId: _actingUserId,
    targetUserId: user.id,
    targetRole: role,
    activeSuperAdminCount: _superAdminCount,
  });
  const blockCheck = canManageAdminTarget({
    action: "block",
    actingUserId: _actingUserId,
    targetUserId: user.id,
    targetRole: role,
    activeSuperAdminCount: _superAdminCount,
  });
  const unblockCheck = canManageAdminTarget({
    action: "unblock",
    actingUserId: _actingUserId,
    targetUserId: user.id,
    targetRole: role,
    activeSuperAdminCount: _superAdminCount,
  });
  const deleteCheck = canManageAdminTarget({
    action: "delete",
    actingUserId: _actingUserId,
    targetUserId: user.id,
    targetRole: role,
    activeSuperAdminCount: _superAdminCount,
  });
  const demoteCheck = canManageAdminTarget({
    action: "demote",
    actingUserId: _actingUserId,
    targetUserId: user.id,
    targetRole: role,
    activeSuperAdminCount: _superAdminCount,
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role,
    roleLabel: getRoleLabel(role),
    createdAt: user.createdAt.toISOString(),
    status,
    statusLabel: status === "blocked" ? "Blocked" : "Active",
    canRemove: role === ADMIN_ROLE && demoteCheck.allowed,
    canResetPassword: resetCheck.allowed,
    canBlock: status === "active" && blockCheck.allowed,
    canUnblock: status === "blocked" && unblockCheck.allowed,
    canDelete: deleteCheck.allowed,
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

  const manageCheck = canManageAdminTarget({
    action: "demote",
    actingUserId,
    targetUserId,
    targetRole,
    activeSuperAdminCount: superAdminCount,
  });

  if (!manageCheck.allowed) {
    return manageCheck;
  }

  return { allowed: true };
}
