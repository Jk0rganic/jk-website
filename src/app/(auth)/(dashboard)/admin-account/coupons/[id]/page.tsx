import EditCouponPage from "./edit-coupon-page";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CouponEditRoute({ params }: Props) {
  const { id } = await params;
  const couponId = Number(id);

  if (!Number.isFinite(couponId)) {
    return <p>Invalid coupon id.</p>;
  }

  return <EditCouponPage couponId={couponId} />;
}
