"use client";

import { useState } from "react";
import { toast } from "sonner";
import k from "./styles.module.scss";
import { formatPrice } from "@/utils/format-price";
import type { CheckoutCoupon } from "@/lib/checkout/coupon";

interface CartSummarySectionProps {
  cartDetails: NonNullable<CheckoutFormType["cartDetails"]>;
  deliveryMethod: CheckoutFormType["delivery_method"];
  shippingCost: NonNullable<CheckoutFormType["shippingCost"]>;
  isSubmitting: boolean;
  itemsTotal: number;
  discount: number;
  grandTotal: number;
  activeCoupon: CheckoutCoupon | null;
  onCouponApplied: (coupon: CheckoutCoupon) => void;
  onCouponRemoved: () => void;
}

export default function CartSummarySection({
  cartDetails = [],
  deliveryMethod = "shipping",
  shippingCost = 160,
  isSubmitting = false,
  itemsTotal,
  discount,
  grandTotal,
  activeCoupon,
  onCouponApplied,
  onCouponRemoved,
}: CartSummarySectionProps) {
  const [couponInput, setCouponInput] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const itemCount = cartDetails.length;
  const deliveryFee = deliveryMethod === "shipping" ? shippingCost : 0;

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;

    try {
      setIsApplyingCoupon(true);

      const res = await fetch("/api/checkout/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          itemsTotal,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Invalid coupon code");
        onCouponRemoved();
        return;
      }

      onCouponApplied(data.coupon);
      toast.success("Coupon applied successfully!");
    } catch (error) {
      console.error("Coupon error:", error);
      onCouponRemoved();
      toast.error("Unable to apply coupon");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCouponInput("");
    onCouponRemoved();
    toast.message("Coupon removed");
  };

  return (
    <div className={k.cart_summary}>
      <h4>Order Summary</h4>

      <table className={k.summary_table}>
        <tbody>
          <tr>
            <td className={k.label}>Items Total ({itemCount})</td>
            <td>{formatPrice(itemsTotal)}</td>
          </tr>

          {discount > 0 && activeCoupon && (
            <tr>
              <td className={k.label}>Discount ({activeCoupon.code})</td>
              <td>-{formatPrice(discount)}</td>
            </tr>
          )}

          {deliveryMethod === "shipping" && (
            <tr>
              <td className={k.label}>Delivery Fee</td>
              <td>{formatPrice(deliveryFee)}</td>
            </tr>
          )}

          <tr className={k.divider_row}>
            <td colSpan={2}>
              <hr className={k.divider} />
            </td>
          </tr>

          <tr>
            <td className={k.label}>
              <strong>Total</strong>
            </td>
            <td>
              <strong className={k.total}>{formatPrice(grandTotal)}</strong>
            </td>
          </tr>
        </tbody>
      </table>

      <div className={k.coupon}>
        <input
          type="text"
          placeholder="Enter coupon code"
          value={couponInput}
          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
          disabled={isSubmitting || isApplyingCoupon || Boolean(activeCoupon)}
        />
        {activeCoupon ? (
          <button
            type="button"
            onClick={removeCoupon}
            disabled={isSubmitting || isApplyingCoupon}
          >
            Remove
          </button>
        ) : (
          <button
            type="button"
            onClick={applyCoupon}
            disabled={!couponInput.trim() || isSubmitting || isApplyingCoupon}
          >
            {isApplyingCoupon ? "Applying..." : "Apply"}
          </button>
        )}
      </div>

      <button
        className={k.btn_submit}
        type="submit"
        disabled={itemCount === 0 || isSubmitting}
      >
        {isSubmitting ? "Confirming Order..." : "Confirm Order"}
      </button>
    </div>
  );
}
