import { seoMeta } from "@/utils/seo/seoMeta";
import OrdersPage from "../../(resources)/dashboard-comp/(pages-comp)/orders/orderPage";

export const metadata = seoMeta.orders; // ✅ Direct match to key in seoMeta

export default function Page() {
  return <OrdersPage />;
}
