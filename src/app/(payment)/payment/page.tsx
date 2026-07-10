import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/getSession";
import { seoMeta } from "@/utils/seo/seoMeta";
import IntaSendPayment from "./comp/intasend-payment";

export const metadata = seoMeta.checkout;

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<{
    orderId?: string;
    checkoutId?: string;
  }>;
}) {
  const params = await searchParams;
  const session = await getSession();

  if (!session?.user?.email) {
    const query = new URLSearchParams();
    if (params.orderId) query.set("orderId", params.orderId);
    if (params.checkoutId) query.set("checkoutId", params.checkoutId);
    const paymentPath = query.toString()
      ? `/payment?${query.toString()}`
      : "/payment";

    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(paymentPath)}`);
  }

  return <IntaSendPayment searchParams={searchParams} />;
}
