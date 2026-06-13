import { seoMeta } from "@/utils/seo/seoMeta";
import PaymentPage from "./payment-page/page";

export const metadata = seoMeta.address;

export default function page() {
  return <PaymentPage />;
}
