import { seoMeta } from "@/utils/seo/seoMeta";
import AddressesPage from "../../(resources)/dashboard-comp/(pages-comp)/adressPage/address-page";
export const dynamic = "force-dynamic";

export const metadata = seoMeta.address;

export default function page() {
  return <AddressesPage />;
}
