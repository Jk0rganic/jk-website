import { redirect } from "next/navigation";
import SingleOrderAccount from "@/app/(auth)/(dashboard)/(resources)/dashboard-comp/(pages-comp)/orders/comp/single-order-acc/page";
import Section from "@/comp/section/section";
import { getSession } from "@/lib/auth/getSession";
import { fetchWoo } from "@/lib/fetch/fetchRest";
import { seoMeta } from "@/utils/seo/seoMeta";
import k from "./styles.module.scss";

export async function generateMetadata({ params }: { params: { id: number } }) {
  const { id } = await params;

  return seoMeta.order(id);
}
export default async function CustomerOrder({
  params,
}: {
  params: { id: number };
}) {
  const session = await getSession();
  const user = session?.user;

  if (!user) {
    redirect("/auth/signin");
  }

  const { id } = await params;

  let order: DashboardOrder | null = null;
  try {
    order = await fetchWoo(`orders/${id}`);
  } catch (error) {
    console.error("Order fetch failed:", error);
  }

  const billingEmail = order?.billing?.email?.toLowerCase() || "";
  const userEmail = user?.email?.toLowerCase() || "";

  if (billingEmail && userEmail && billingEmail !== userEmail) {
    redirect(`/account/orders/${id}`);
  }

  return (
    <Section className={k.order_container}>
      {!order && <p>Order not found.</p>}
      {order && <SingleOrderAccount order={order} />}
    </Section>
  );
}
