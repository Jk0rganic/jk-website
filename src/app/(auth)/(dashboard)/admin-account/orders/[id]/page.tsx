import { fetchWoo } from "@/lib/fetch/fetchRest";
import { seoMeta } from "@/utils/seo/seoMeta";
import SingleOrderAccount from "../../../(resources)/dashboard-comp/(pages-comp)/orders/comp/single-order-acc/page";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { id } = await params;

  return seoMeta.order(id as unknown as number);
}

export default async function order({ params }: { params: { id: string } }) {
  const { id } = await params;
  const order: DashboardOrder | null = await fetchWoo(`orders/${id}`);

  return <SingleOrderAccount order={order} />;
}
