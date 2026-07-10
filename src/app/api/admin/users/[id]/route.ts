import {
  canManageAdminTarget,
  canRevokeAdminRole,
} from "@/lib/admin/admin-user-service";
import { requireSuperAdminSession } from "@/lib/admin/require-admin";
import { SUPER_ADMIN_ROLE, USER_ROLE } from "@/lib/admin/roles";
import prisma from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

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
    const [targetUser, superAdminCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id },
        select: { id: true, role: true, email: true, name: true },
      }),
      prisma.user.count({
        where: {
          role: SUPER_ADMIN_ROLE,
          disabledAt: null,
          deletedAt: null,
        },
      }),
    ]);

    if (!targetUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const targetRole = targetUser.role || USER_ROLE;
    const revokeCheck = canRevokeAdminRole(
      targetRole,
      session.user.id,
      targetUser.id,
      superAdminCount,
    );

    if (!revokeCheck.allowed) {
      return Response.json({ error: revokeCheck.reason }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role: USER_ROLE },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        disabledAt: true,
        deletedAt: true,
      },
    });

    return Response.json({ user });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update user";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { error, status, session } = await requireSuperAdminSession();

  if (error || !session) {
    return Response.json({ error }, { status });
  }

  const { id } = await params;

  try {
    const [targetUser, activeSuperAdminCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id },
        select: { id: true, role: true, email: true, name: true },
      }),
      prisma.user.count({
        where: {
          role: SUPER_ADMIN_ROLE,
          disabledAt: null,
          deletedAt: null,
        },
      }),
    ]);

    if (!targetUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const targetRole = targetUser.role || USER_ROLE;
    const manageCheck = canManageAdminTarget({
      action: "delete",
      actingUserId: session.user.id,
      targetUserId: targetUser.id,
      targetRole,
      activeSuperAdminCount,
    });

    if (!manageCheck.allowed) {
      return Response.json({ error: manageCheck.reason }, { status: 400 });
    }

    const deletedAt = new Date();
    const user = await prisma.user.update({
      where: { id },
      data: {
        deletedAt,
        disabledAt: deletedAt,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        disabledAt: true,
        deletedAt: true,
      },
    });

    return Response.json({ user });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete admin user";
    return Response.json({ error: message }, { status: 500 });
  }
}
