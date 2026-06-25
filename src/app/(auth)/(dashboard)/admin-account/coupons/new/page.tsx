"use client";

import { useRouter } from "next/navigation";
import CouponForm from "../comp/coupon-form";
import { BackLink } from "../../components/ui/page-header";
import ui from "../../components/ui/admin-ui.module.scss";

export default function NewCouponPage() {
  const router = useRouter();

  return (
    <>
      <BackLink href="/admin-account/coupons" label="Back to coupons" />

      <div className={ui.pageHeader}>
        <div>
          <h2 className={ui.pageTitle}>Create coupon</h2>
          <p className={ui.pageSubtitle}>
            Set up a discount code customers can use at checkout.
          </p>
        </div>
      </div>

      <CouponForm
        mode="create"
        onSuccess={() => {
          router.push("/admin-account/coupons");
          router.refresh();
        }}
      />
    </>
  );
}
