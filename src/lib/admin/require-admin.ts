import "server-only";

import { getSession } from "@/lib/auth/getSession";
import prisma from "@/lib/prisma";
import { isActiveAdminUser } from "./admin-user-service";
import { canManageAdmins } from "./roles";

function isMissingAdminStatusColumnError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /auth_version|disabled_at|deleted_at/.test(message);
}

async function getCurrentAdminStatus(userId: string) {
  try {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        disabledAt: true,
        deletedAt: true,
        authVersion: true,
      },
    });
  } catch (error) {
    if (!isMissingAdminStatusColumnError(error)) {
      throw error;
    }

    const [legacyStatus] = await prisma.$queryRaw<
      Array<{
        role: string | null;
        disabledAt: Date | null;
        deletedAt: Date | null;
        authVersion: number;
      }>
    >`
      select
        role,
        null::timestamp as "disabledAt",
        null::timestamp as "deletedAt",
        0 as "authVersion"
      from users
      where id = ${userId}
      limit 1
    `;

    return legacyStatus ?? null;
  }
}

export async function requireAdminSession() {
  const session = await getSession();

  if (!session?.user) {
    return { error: "Unauthorized", status: 401 as const, session: null };
  }

  const currentUser = await getCurrentAdminStatus(session.user.id);

  if (
    !currentUser ||
    !isActiveAdminUser(currentUser) ||
    session.user.authVersion !== currentUser.authVersion
  ) {
    return { error: "Forbidden", status: 403 as const, session: null };
  }

  return { error: null, status: 200 as const, session };
}

export async function requireSuperAdminSession() {
  const session = await getSession();

  if (!session?.user) {
    return { error: "Unauthorized", status: 401 as const, session: null };
  }

  const currentUser = await getCurrentAdminStatus(session.user.id);

  if (
    !currentUser ||
    !canManageAdmins(currentUser.role) ||
    currentUser.disabledAt ||
    currentUser.deletedAt ||
    session.user.authVersion !== currentUser.authVersion
  ) {
    return { error: "Forbidden", status: 403 as const, session: null };
  }

  return { error: null, status: 200 as const, session };
}
