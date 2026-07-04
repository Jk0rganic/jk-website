import { adminStatusSchema } from "@/lib/admin/admin-user-schema";
import { canManageAdminTarget } from "@/lib/admin/admin-user-service";
import { requireSuperAdminSession } from "@/lib/admin/require-admin";
import { SUPER_ADMIN_ROLE, USER_ROLE } from "@/lib/admin/roles";
import prisma from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

const adminUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  disabledAt: true,
  deletedAt: true,
} as const;

const activeSuperAdminWhere = {
  role: SUPER_ADMIN_ROLE,
  disabledAt: null,
  deletedAt: null,
} as const;

export async function PATCH(request: Request, { params }: RouteParams) {
  const { error, status, session } = await requireSuperAdminSession();

  if (error || !session) {
    return Response.json({ error }, { status });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = adminStatusSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid status data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { id } = await params;

  if (id === session.user.id) {
    return Response.json(
      { error: "You cannot manage your own admin account" },
      { status: 400 },
    );
  }

  try {
    const [targetUser, superAdminCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          role: true,
          disabledAt: true,
          deletedAt: true,
        },
      }),
      prisma.user.count({ where: activeSuperAdminWhere }),
    ]);

    if (!targetUser || targetUser.deletedAt) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const decision = canManageAdminTarget({
      action: parsed.data.disabled ? "block" : "unblock",
      actingUserId: session.user.id,
      actingUserRole: session.user.role || SUPER_ADMIN_ROLE,
      targetUserId: targetUser.id,
      targetRole: targetUser.role || USER_ROLE,
      activeSuperAdminCount: superAdminCount,
    });

    if (!decision.allowed) {
      return Response.json({ error: decision.reason }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { disabledAt: parsed.data.disabled ? new Date() : null },
      select: adminUserSelect,
    });

    if (parsed.data.disabled) {
      await prisma.session.deleteMany({ where: { userId: id } });
    }

    return Response.json({ user });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update user status";
    return Response.json({ error: message }, { status: 500 });
  }
}
