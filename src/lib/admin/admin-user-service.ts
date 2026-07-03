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
  deletedAt?: Date | null;
}): boolean {
  return (
    (user.role === ADMIN_ROLE || user.role === SUPER_ADMIN_ROLE) &&
    !user.deletedAt
  );
}

export function mapAdminUser(
  user: UserRow,
  _actingUserId: string,
  _superAdminCount: number,
): AdminUserListItem {
  const role = user.role || USER_ROLE;
  const disabledAt = user.disabledAt ?? null;
  const deletedAt = user.deletedAt ?? null;
  const isDisabled = Boolean(disabledAt);
  const isDeleted = Boolean(deletedAt);

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
    canRemove: role === ADMIN_ROLE,
  };
}

export function canCreateAdminRole(role: string): role is typeof ADMIN_ROLE {
  return role === ADMIN_ROLE;
}

export function canManageAdminTarget(args: {
  action: AdminTargetAction;
  actingUserId: string;
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
  superAdminCount: number,
): { allowed: boolean; reason?: string } {
  if (targetRole === USER_ROLE) {
    return { allowed: false, reason: "This user is already a customer" };
  }

  const decision = canManageAdminTarget({
    action: "demote",
    actingUserId,
    targetUserId,
    targetRole,
    activeSuperAdminCount: superAdminCount,
  });

  if (!decision.allowed) {
    return decision;
  }

  return { allowed: true };
}
