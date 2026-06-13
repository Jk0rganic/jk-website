"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import k from "./styles.module.scss";
import { fetchWoo } from "@/lib/fetch/fetchRest";
import { formatPrice } from "@/utils/format-price";

interface Coupon {
  code: string;
  amount: string;
  discount_type: "percent" | "fixed_cart";
  status: string;
}

interface BuildOrderPayloadProps {
  cartDetails: NonNullable<CheckoutFormType["cartDetails"]>;
  deliveryMethod: CheckoutFormType["delivery_method"];
  shippingCost: NonNullable<CheckoutFormType["shippingCost"]>;
  isSubmitting: boolean;
}

export default function CartSummarySection({
  cartDetails = [],
  deliveryMethod = "shipping",
  shippingCost = 160,
  isSubmitting = false,
}: BuildOrderPayloadProps) {
  const [couponInput, setCouponInput] = useState("");
  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const itemCount = cartDetails.length;

  const itemsTotal = useMemo(
    () =>
      cartDetails.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      ),
    [cartDetails],
  );

  const discount = useMemo(() => {
    if (!activeCoupon) return 0;

    const couponAmountNum = Number(activeCoupon.amount) || 0;
    let discountAmount = 0;

    switch (activeCoupon.discount_type) {
      case "percent":
        discountAmount = (itemsTotal * couponAmountNum) / 100;
        break;
      case "fixed_cart":
        discountAmount = couponAmountNum;
        break;
    }

    return Math.min(discountAmount, itemsTotal);
  }, [activeCoupon, itemsTotal]);

  const deliveryFee = deliveryMethod === "shipping" ? shippingCost : 0;
  const grandTotal = Math.max(0, itemsTotal + deliveryFee - discount);

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;

    try {
      setIsApplyingCoupon(true);

      const data = await fetchWoo<Coupon[]>(
        `coupons?code=${encodeURIComponent(code)}`,
      );
      const couponData = data?.[0];

      if (!couponData) {
        toast.error("Invalid coupon code");
        setActiveCoupon(null);
        return;
      }

      if (couponData.status !== "publish") {
        toast.error("Coupon is not active");
        return;
      }

      setActiveCoupon(couponData);
      toast.success("Coupon applied successfully!");
    } catch (error) {
      console.error("Coupon error:", error);
      setActiveCoupon(null);
      toast.error("Unable to apply coupon");
    } finally {
      setIsApplyingCoupon(false);
    }
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
          disabled={isSubmitting || isApplyingCoupon}
        />
        <button
          type="button"
          onClick={applyCoupon}
          disabled={!couponInput.trim() || isSubmitting || isApplyingCoupon}
        >
          {isApplyingCoupon ? "Applying..." : "Apply"}
        </button>
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
