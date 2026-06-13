import { seoMeta } from "@/utils/seo/seoMeta";
import DetailsPage from "../../(resources)/dashboard-comp/(pages-comp)/detailsPage/details-page";

export const metadata = seoMeta.accountDetails;

export default function page() {
  return <DetailsPage />;
}
