import { seoMeta } from "@/utils/seo/seoMeta";
import DetailsPage from "../../(resources)/dashboard-comp/(pages-comp)/detailsPage/details-page";
import { AdminCard } from "../components/ui/page-header";

export const metadata = seoMeta.accountDetails;

export default function page() {
  return (
    <AdminCard title="Profile">
      <DetailsPage />
    </AdminCard>
  );
}
