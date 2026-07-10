import bcrypt from "bcryptjs";
import { resetAdminPasswordSchema } from "@/lib/admin/admin-user-schema";
import { canManageAdminTarget } from "@/lib/admin/admin-user-service";
import { requireSuperAdminSession } from "@/lib/admin/require-admin";
import { SUPER_ADMIN_ROLE, USER_ROLE } from "@/lib/admin/roles";
import prisma from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

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

  const parsed = resetAdminPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid password data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { id } = await params;

  try {
    const [targetUser, activeSuperAdminCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id },
        select: { id: true, role: true },
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

    const manageCheck = canManageAdminTarget({
      action: "reset_password",
      actingUserId: session.user.id,
      targetUserId: targetUser.id,
      targetRole: targetUser.role || USER_ROLE,
      activeSuperAdminCount,
    });

    if (!manageCheck.allowed) {
      return Response.json({ error: manageCheck.reason }, { status: 400 });
    }

    const password = await bcrypt.hash(parsed.data.password, 10);

    const user = await prisma.user.update({
      where: { id },
      data: { password },
      select: { id: true },
    });

    return Response.json({ user });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to reset password";
    return Response.json({ error: message }, { status: 500 });
  }
}
