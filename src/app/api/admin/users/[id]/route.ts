import { Prisma } from "@/generated/prisma/client";
import {
  canManageAdminTarget,
  canRevokeAdminRole,
} from "@/lib/admin/admin-user-service";
import { requireSuperAdminSession } from "@/lib/admin/require-admin";
import { SUPER_ADMIN_ROLE, USER_ROLE } from "@/lib/admin/roles";
import prisma from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };
type AdminUserTransaction = Pick<typeof prisma, "session" | "user">;

const adminUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  disabledAt: true,
  deletedAt: true,
} as const;

const adminTargetSelect = {
  id: true,
  role: true,
  email: true,
  name: true,
  disabledAt: true,
  deletedAt: true,
} as const;

const activeSuperAdminWhere = {
  role: SUPER_ADMIN_ROLE,
  disabledAt: null,
  deletedAt: null,
} as const;

export async function PATCH(_request: Request, { params }: RouteParams) {
  const { error, status, session } = await requireSuperAdminSession();

  if (error || !session) {
    return Response.json({ error }, { status });
  }

  const { id } = await params;

  if (id === session.user.id) {
    return Response.json(
      { error: "You cannot change your own admin access here" },
      { status: 400 },
    );
  }

  try {
    const result = await prisma.$transaction(
      async (tx: AdminUserTransaction) => {
        const [targetUser, superAdminCount] = await Promise.all([
          tx.user.findUnique({
            where: { id },
            select: adminTargetSelect,
          }),
          tx.user.count({ where: activeSuperAdminWhere }),
        ]);

        if (!targetUser || targetUser.deletedAt) {
          return { error: "User not found", status: 404 as const };
        }

        const targetRole = targetUser.role || USER_ROLE;
        const revokeCheck = canRevokeAdminRole(
          targetRole,
          session.user.id,
          targetUser.id,
          superAdminCount,
          session.user.role,
          targetUser.disabledAt,
          targetUser.deletedAt,
        );

        if (!revokeCheck.allowed) {
          return { error: revokeCheck.reason, status: 400 as const };
        }

        const user = await tx.user.update({
          where: { id },
          data: { role: USER_ROLE },
          select: adminUserSelect,
        });

        return { user };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    if ("error" in result) {
      return Response.json({ error: result.error }, { status: result.status });
    }

    return Response.json({ user: result.user });
  } catch (err) {
    console.error("[ADMIN_USER_PATCH_ERROR]", err);
    return Response.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { error, status, session } = await requireSuperAdminSession();

  if (error || !session) {
    return Response.json({ error }, { status });
  }

  const { id } = await params;

  if (id === session.user.id) {
    return Response.json(
      { error: "You cannot manage your own admin account" },
      { status: 400 },
    );
  }

  try {
    const result = await prisma.$transaction(
      async (tx: AdminUserTransaction) => {
        const [targetUser, superAdminCount] = await Promise.all([
          tx.user.findUnique({
            where: { id },
            select: adminTargetSelect,
          }),
          tx.user.count({ where: activeSuperAdminWhere }),
        ]);

        if (!targetUser || targetUser.deletedAt) {
          return { error: "User not found", status: 404 as const };
        }

        const decision = canManageAdminTarget({
          action: "delete",
          actingUserId: session.user.id,
          actingUserRole: session.user.role,
          targetUserId: targetUser.id,
          targetRole: targetUser.role || USER_ROLE,
          targetDisabledAt: targetUser.disabledAt,
          targetDeletedAt: targetUser.deletedAt,
          activeSuperAdminCount: superAdminCount,
        });

        if (!decision.allowed) {
          return { error: decision.reason, status: 400 as const };
        }

        const user = await tx.user.update({
          where: { id },
          data: { deletedAt: new Date() },
          select: adminUserSelect,
        });

        await tx.session.deleteMany({ where: { userId: id } });

        return { user };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    if ("error" in result) {
      return Response.json({ error: result.error }, { status: result.status });
    }

    return Response.json({ user: result.user });
  } catch (err) {
    console.error("[ADMIN_USER_DELETE_ERROR]", err);
    return Response.json({ error: "Failed to delete admin" }, { status: 500 });
  }
}
