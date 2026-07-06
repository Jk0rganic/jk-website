import { seoMeta } from "@/utils/seo/seoMeta";
import { logoutTo } from "@/app/(auth)/auth/signup/comp/social_login/action";
import { ADMIN_SIGN_IN_PATH } from "@/lib/auth/admin-login";
import DetailsPage from "../../(resources)/dashboard-comp/(pages-comp)/detailsPage/details-page";
import { AdminBadge } from "../components/ui/admin-badge";
import { AdminPanel } from "../components/ui/admin-panel";
import ui from "../components/ui/admin-ui.module.scss";
import { PageHeader } from "../components/ui/page-header";

export const metadata = seoMeta.accountDetails;

export default function page() {
  async function signOutAdmin() {
    "use server";

    await logoutTo(ADMIN_SIGN_IN_PATH);
  }

  return (
    <>
      <PageHeader
        title="Account"
        subtitle="Profile, access level, and current admin session."
      />

      <div className={ui.dashboardGrid}>
        <AdminPanel
          title="Profile"
          description="Read-only identity details for the signed-in admin."
        >
          <DetailsPage />
        </AdminPanel>

        <div className={ui.stack}>
          <AdminPanel
            title="Access"
            description="This account is authorized for the admin console."
            action={<AdminBadge tone="success">Admin</AdminBadge>}
          >
            <p className={ui.muted}>
              Admin permissions are managed by super admins from the Admins
              page. Contact a super admin if this access should change.
            </p>
          </AdminPanel>

          <AdminPanel
            title="Session"
            description="End the current admin session on this device."
          >
            <form action={signOutAdmin}>
              <button type="submit" className={ui.btnAccent}>
                Sign out
              </button>
            </form>
          </AdminPanel>
        </div>
      </div>
    </>
  );
}
