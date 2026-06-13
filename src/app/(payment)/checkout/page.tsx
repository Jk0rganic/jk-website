import { seoMeta } from "@/utils/seo/seoMeta";
import CheckOutComp from "./comp/checkout-comp/checkout-comp";

export const metadata = seoMeta.checkout;

export default function CheckOut() {
  return <CheckOutComp />;
}
