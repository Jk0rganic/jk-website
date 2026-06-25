import EditProductPage from "./edit-product-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditProductPage productId={Number(id)} />;
}
