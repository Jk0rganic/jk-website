"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminCoupon } from "@/lib/admin/coupon-service";
import CouponForm from "../comp/coupon-form";
import { BackLink } from "../../components/ui/page-header";
import ui from "../../components/ui/admin-ui.module.scss";

export default function EditCouponPage({ couponId }: { couponId: number }) {
  const router = useRouter();
  const [coupon, setCoupon] = useState<AdminCoupon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCoupon() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/admin/coupons/${couponId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load coupon");
        }

        setCoupon(data.coupon);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load coupon");
      } finally {
        setLoading(false);
      }
    }

    loadCoupon();
  }, [couponId]);

  if (loading) return <p className={ui.muted}>Loading coupon…</p>;
  if (error) return <p className={ui.error}>{error}</p>;
  if (!coupon) return <p className={ui.empty}>Coupon not found.</p>;

  return (
    <>
      <BackLink href="/admin-account/coupons" label="Back to coupons" />

      <div className={ui.pageHeader}>
        <div>
          <h2 className={ui.pageTitle}>Edit coupon</h2>
          <p className={ui.pageSubtitle}>{coupon.code}</p>
        </div>
      </div>

      <CouponForm
        mode="edit"
        coupon={coupon}
        onSuccess={() => {
          router.push("/admin-account/coupons");
          router.refresh();
        }}
      />
    </>
  );
}
