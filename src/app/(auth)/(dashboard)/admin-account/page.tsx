import { seoMeta } from "@/utils/seo/seoMeta";
import AdminDashboard from "./components/dashboard/admin-dashboard";

export const metadata = seoMeta.account;

export default function Page() {
  return <AdminDashboard />;
}
