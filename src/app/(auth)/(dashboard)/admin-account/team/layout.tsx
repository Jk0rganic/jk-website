import { getSession } from "@/lib/auth/getSession";
import { canManageAdmins } from "@/lib/admin/roles";
import { getAdminSignInUrl } from "@/lib/auth/admin-login";
import { redirect } from "next/navigation";

export default async function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect(getAdminSignInUrl("/admin-account/team"));
  }

  if (!canManageAdmins(session.user.role)) {
    redirect("/admin-account");
  }

  return children;
}
