import { getRoleLabel } from "@/lib/admin/roles";
import { getSession } from "@/lib/auth/getSession";
import { seoMeta } from "@/utils/seo/seoMeta";
import ProfileDetailsPage from "./profile-details-page";

export const metadata = seoMeta.accountDetails;

export default async function Page() {
  const session = await getSession();

  return (
    <ProfileDetailsPage
      user={{
        name: session?.user.name || "Admin user",
        email: session?.user.email || "admin@jkorganics.co.ke",
        role: session?.user.role || "min_admin",
        roleLabel: getRoleLabel(session?.user.role || "min_admin"),
      }}
    />
  );
}
