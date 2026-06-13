import { seoMeta } from "@/utils/seo/seoMeta";
import IntaSendPayment from "./comp/intasend-payment";

export const metadata = seoMeta.checkout;

export default function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<{
    orderId?: string;
    checkoutId?: string;
  }>;
}) {
  return <IntaSendPayment searchParams={searchParams} />;
}
