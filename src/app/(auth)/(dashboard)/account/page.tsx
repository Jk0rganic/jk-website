import { seoMeta } from "@/utils/seo/seoMeta";
import DashboardPage from "../(resources)/dashboard-comp/accountPage/accountPage";

export const metadata = seoMeta.account;

export default function Page() {
  return <DashboardPage />;
}
