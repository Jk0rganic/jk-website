import { fetchWoo } from "@/lib/fetch/fetchRest";
import { seoMeta } from "@/utils/seo/seoMeta";
import AdminSingleOrder from "../comp/admin-single-order";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { id } = await params;

  return seoMeta.order(id as unknown as number);
}

export default async function order({ params }: { params: { id: string } }) {
  const { id } = await params;
  const order: DashboardOrder | null = await fetchWoo(`orders/${id}`);

  return <AdminSingleOrder order={order} />;
}
