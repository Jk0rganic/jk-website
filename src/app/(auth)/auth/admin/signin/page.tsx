import { seoMeta } from "@/utils/seo/seoMeta";
import { getAdminCallbackUrl } from "@/lib/auth/admin-login";
import { getSession } from "@/lib/auth/getSession";
import { isAdminRole } from "@/lib/admin/roles";
import { redirect } from "next/navigation";
import AdminSignInForm from "./comp/admin-signin-form";

export const metadata = seoMeta.adminSignin;

export default async function AdminSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const safeCallbackUrl = getAdminCallbackUrl(callbackUrl);
  const session = await getSession();

  if (session && isAdminRole(session.user.role)) {
    redirect(safeCallbackUrl);
  }

  return <AdminSignInForm callbackUrl={safeCallbackUrl} />;
}
