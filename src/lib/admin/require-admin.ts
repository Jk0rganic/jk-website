import "server-only";

import { getSession } from "@/lib/auth/getSession";
import { isActiveAdminUser } from "./admin-user-service";
import { canManageAdmins } from "./roles";

export async function requireAdminSession() {
  const session = await getSession();

  if (!session?.user) {
    return { error: "Unauthorized", status: 401 as const, session: null };
  }

  if (!isActiveAdminUser(session.user)) {
    return { error: "Forbidden", status: 403 as const, session: null };
  }

  return { error: null, status: 200 as const, session };
}

export async function requireSuperAdminSession() {
  const session = await getSession();

  if (!session?.user) {
    return { error: "Unauthorized", status: 401 as const, session: null };
  }

  if (
    !canManageAdmins(session.user.role) ||
    session.user.disabledAt ||
    session.user.deletedAt
  ) {
    return { error: "Forbidden", status: 403 as const, session: null };
  }

  return { error: null, status: 200 as const, session };
}
