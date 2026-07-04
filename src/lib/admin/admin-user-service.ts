import { ADMIN_ROLE, getRoleLabel, SUPER_ADMIN_ROLE, USER_ROLE } from "./roles";

export type AdminUserRecord = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  disabledAt?: Date | null;
  deletedAt?: Date | null;
};

export type AdminUserListItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
  createdAt: string;
  disabledAt: string | null;
  deletedAt: string | null;
  isDisabled: boolean;
  isDeleted: boolean;
  statusLabel: "Active" | "Disabled" | "Deleted";
  canResetPassword: boolean;
  canBlock: boolean;
  canUnblock: boolean;
  canDelete: boolean;
  canDemote: boolean;
  canRemove: boolean;
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

export type AdminTargetAction =
  | "reset_password"
  | "block"
  | "unblock"
  | "delete"
  | "demote";

export type AdminManagementDecision = {
  allowed: boolean;
  reason?: string;
};

export function isActiveAdminUser(user: {
  role: string | null;
  disabledAt?: Date | string | null;
  deletedAt?: Date | string | null;
}): boolean {
  return (
    (user.role === ADMIN_ROLE || user.role === SUPER_ADMIN_ROLE) &&
    !user.disabledAt &&
    !user.deletedAt
  );
}

export function mapAdminUser(
  user: UserRow,
  actingUserId: string,
  activeSuperAdminCount: number,
  actingUserRole: string = SUPER_ADMIN_ROLE,
): AdminUserListItem {
  const role = user.role || USER_ROLE;
  const disabledAt = user.disabledAt ?? null;
  const deletedAt = user.deletedAt ?? null;
  const isDisabled = Boolean(disabledAt);
  const isDeleted = Boolean(deletedAt);
  const canResetPassword =
    !isDeleted &&
    canManageAdminTarget({
      action: "reset_password",
      actingUserId,
      actingUserRole,
      targetUserId: user.id,
      targetRole: role,
      activeSuperAdminCount,
    }).allowed;
  const canBlock =
    !isDisabled &&
    !isDeleted &&
    canManageAdminTarget({
      action: "block",
      actingUserId,
      actingUserRole,
      targetUserId: user.id,
      targetRole: role,
      activeSuperAdminCount,
    }).allowed;
  const canUnblock =
    isDisabled &&
    !isDeleted &&
    canManageAdminTarget({
      action: "unblock",
      actingUserId,
      actingUserRole,
      targetUserId: user.id,
      targetRole: role,
      activeSuperAdminCount,
    }).allowed;
  const canDelete =
    !isDeleted &&
    canManageAdminTarget({
      action: "delete",
      actingUserId,
      actingUserRole,
      targetUserId: user.id,
      targetRole: role,
      activeSuperAdminCount,
    }).allowed;
  const canDemote =
    !isDeleted &&
    canManageAdminTarget({
      action: "demote",
      actingUserId,
      actingUserRole,
      targetUserId: user.id,
      targetRole: role,
      activeSuperAdminCount,
    }).allowed;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role,
    roleLabel: getRoleLabel(role),
    createdAt: user.createdAt.toISOString(),
    disabledAt: disabledAt?.toISOString() ?? null,
    deletedAt: deletedAt?.toISOString() ?? null,
    isDisabled,
    isDeleted,
    statusLabel: isDeleted ? "Deleted" : isDisabled ? "Disabled" : "Active",
    canResetPassword,
    canBlock,
    canUnblock,
    canDelete,
    canDemote,
    canRemove: canDemote && role === ADMIN_ROLE,
  };
}

export function canCreateAdminRole(role: string): role is typeof ADMIN_ROLE {
  return role === ADMIN_ROLE;
}

export function canManageAdminTarget(args: {
  action: AdminTargetAction;
  actingUserId: string;
  actingUserRole: string;
  targetUserId: string;
  targetRole: string;
  activeSuperAdminCount: number;
}): AdminManagementDecision {
  if (args.actingUserId === args.targetUserId) {
    return {
      allowed: false,
      reason: "You cannot manage your own admin account",
    };
  }

  if (args.actingUserRole !== SUPER_ADMIN_ROLE) {
    return {
      allowed: false,
      reason: "Only super admins can manage admin accounts",
    };
  }

  if (
    args.targetRole === SUPER_ADMIN_ROLE &&
    args.activeSuperAdminCount <= 1 &&
    (args.action === "block" ||
      args.action === "delete" ||
      args.action === "demote")
  ) {
    return {
      allowed: false,
      reason: "At least one super admin must remain on the account",
    };
  }

  return { allowed: true };
}

export function canRevokeAdminRole(
  targetRole: string,
  actingUserId: string,
  targetUserId: string,
  activeSuperAdminCount: number,
  actingUserRole: string = SUPER_ADMIN_ROLE,
): { allowed: boolean; reason?: string } {
  if (targetRole === USER_ROLE) {
    return { allowed: false, reason: "This user is already a customer" };
  }

  const decision = canManageAdminTarget({
    action: "demote",
    actingUserId,
    actingUserRole,
    targetUserId,
    targetRole,
    activeSuperAdminCount,
  });

  if (!decision.allowed) {
    return decision;
  }

  return { allowed: true };
}
