import bcrypt from "bcryptjs";
import { resetAdminPasswordSchema } from "@/lib/admin/admin-user-schema";
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

  if (id === session.user.id) {
    return Response.json(
      { error: "You cannot manage your own admin account" },
      { status: 400 },
    );
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, deletedAt: true },
    });

    if (!targetUser || targetUser.deletedAt) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const decision = canManageAdminTarget({
      action: "reset_password",
      actingUserId: session.user.id,
      actingUserRole: session.user.role || SUPER_ADMIN_ROLE,
      targetUserId: targetUser.id,
      targetRole: targetUser.role || USER_ROLE,
      activeSuperAdminCount: 1,
    });

    if (!decision.allowed) {
      return Response.json({ error: decision.reason }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, 10);
    const user = await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
      select: adminUserSelect,
    });

    return Response.json({ user });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to reset password";
    return Response.json({ error: message }, { status: 500 });
  }
}
