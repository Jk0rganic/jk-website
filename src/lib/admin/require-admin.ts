import "server-only";

import { getSession } from "@/lib/auth/getSession";
import { canManageAdmins, isAdminRole } from "./roles";

export async function requireAdminSession() {
  const session = await getSession();

  if (!session?.user) {
    return { error: "Unauthorized", status: 401 as const, session: null };
  }

  if (!isAdminRole(session.user.role)) {
    return { error: "Forbidden", status: 403 as const, session: null };
  }

  return { error: null, status: 200 as const, session };
}

export async function requireSuperAdminSession() {
  const session = await getSession();

  if (!session?.user) {
    return { error: "Unauthorized", status: 401 as const, session: null };
  }

  if (!canManageAdmins(session.user.role)) {
    return { error: "Forbidden", status: 403 as const, session: null };
  }

  return { error: null, status: 200 as const, session };
}
