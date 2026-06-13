import { seoMeta } from "@/utils/seo/seoMeta";
import DashboardPageAdmin from "./comp/accountPage/accountPage";

export const metadata = seoMeta.account;

export default function Page() {
  return <DashboardPageAdmin />;
}
