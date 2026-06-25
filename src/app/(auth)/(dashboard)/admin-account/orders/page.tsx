import { seoMeta } from "@/utils/seo/seoMeta";
import AdminOrdersPage from "./comp/admin-orders-page";

export const metadata = seoMeta.orders;

export default function Page() {
  return <AdminOrdersPage />;
}
