import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { getAdminCallbackUrl } from "@/lib/auth/admin-login";
import { seoMeta } from "@/utils/seo/seoMeta";
import AdminSignInForm from "./comp/admin-signin-form";

export const metadata = seoMeta.adminSignin;

export default async function AdminSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const safeCallbackUrl = getAdminCallbackUrl(callbackUrl);
  const { status } = await requireAdminSession();

  if (status === 200) {
    redirect(safeCallbackUrl);
  }

  return <AdminSignInForm callbackUrl={safeCallbackUrl} />;
}
