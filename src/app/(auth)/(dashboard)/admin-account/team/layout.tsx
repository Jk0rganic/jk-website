import { redirect } from "next/navigation";
import { requireSuperAdminSession } from "@/lib/admin/require-admin";
import { getAdminSignInUrl } from "@/lib/auth/admin-login";

export default async function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = await requireSuperAdminSession();

  if (status === 401) {
    redirect(getAdminSignInUrl("/admin-account/team"));
  }

  if (status === 403) {
    redirect("/admin-account");
  }

  return children;
}
