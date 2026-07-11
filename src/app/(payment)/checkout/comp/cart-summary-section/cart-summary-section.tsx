"use client";

import { Package, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import type { CheckoutCoupon } from "@/lib/checkout/coupon";
import { formatPrice } from "@/utils/format-price";
import k from "./styles.module.scss";

interface CartSummarySectionProps {
  cartDetails: NonNullable<CheckoutFormType["cartDetails"]>;
  deliveryMethod: CheckoutFormType["delivery_method"];
  shippingCost: NonNullable<CheckoutFormType["shippingCost"]>;
  deliveryQuote?: {
    method: "shipping" | "pickup";
    fee: number;
    label: string;
    eta?: string | null;
    available: boolean;
  } | null;
  isSubmitting: boolean;
  itemsTotal: number;
  discount: number;
  grandTotal: number;
  activeCoupon: CheckoutCoupon | null;
  onCouponApplied: (coupon: CheckoutCoupon) => void;
  onCouponRemoved: () => void;
  showSubmit?: boolean;
}

export default function CartSummarySection({
  cartDetails = [],
  deliveryMethod = "shipping",
  shippingCost = 160,
  deliveryQuote = null,
  isSubmitting = false,
  itemsTotal,
  discount,
  grandTotal,
  activeCoupon,
  onCouponApplied,
  onCouponRemoved,
  showSubmit = true,
}: CartSummarySectionProps) {
  const [couponInput, setCouponInput] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const itemCount = cartDetails.length;
  const deliveryUnavailable =
    deliveryMethod === "shipping" && deliveryQuote?.available === false;
  const deliveryPending = deliveryMethod === "shipping" && !deliveryQuote;
  let deliveryFee = 0;
  if (deliveryMethod === "shipping") {
    deliveryFee =
      deliveryQuote?.available === true ? deliveryQuote.fee : shippingCost;
  }
  const deliveryText = (() => {
    if (deliveryMethod !== "shipping") return "Free";
    if (deliveryPending) return "Select county";
    if (deliveryUnavailable) return "Unavailable";
    return formatPrice(deliveryFee);
  })();
  const ctaText = "Send M-Pesa prompt";

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
      <h3>Order summary</h3>

      <ul className={k.cart_items} aria-label="Cart items">
        {cartDetails.map((item) => (
          <li className={k.cart_item} key={item.id}>
            {item.image?.mediaItemUrl ? (
              <Image
                className={k.item_image}
                src={item.image.mediaItemUrl}
                alt={item.image?.title || item.name}
                width={64}
                height={64}
                sizes="64px"
                unoptimized
              />
            ) : (
              <span className={k.item_placeholder}>
                <Package size={18} />
              </span>
            )}
            <div className={k.item_details}>
              <p className={k.item_name}>{item.name}</p>
              <p className={k.item_quantity}>Qty {item.quantity}</p>
            </div>
            <strong className={k.item_total}>
              {formatPrice(item.price * item.quantity)}
            </strong>
          </li>
        ))}
      </ul>

      <div className={k.coupon}>
        <input
          type="text"
          placeholder="Coupon code"
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

      <div className={k.total_rows}>
        <div>
          <span>Subtotal</span>
          <span>{formatPrice(itemsTotal)}</span>
        </div>

        {discount > 0 && activeCoupon ? (
          <div>
            <span>Discount ({activeCoupon.code})</span>
            <span>-{formatPrice(discount)}</span>
          </div>
        ) : null}

        <div>
          <span>Delivery</span>
          <span>{deliveryText}</span>
        </div>

        {deliveryMethod === "shipping" && deliveryQuote ? (
          <div className={k.delivery_quote}>
            <span>{deliveryQuote.label}</span>
            <span>
              {deliveryQuote.available
                ? (deliveryQuote.eta ?? "ETA to be confirmed")
                : "Choose another county"}
            </span>
          </div>
        ) : null}

        <div className={k.total_row}>
          <strong>Total</strong>
          <strong>{formatPrice(grandTotal)}</strong>
        </div>
      </div>

      {showSubmit ? (
        <button
          className={k.btn_submit}
          type="submit"
          disabled={itemCount === 0 || isSubmitting}
        >
          {isSubmitting ? "Confirming Order..." : ctaText}
        </button>
      ) : null}

      <p className={k.trust_copy}>
        <ShieldCheck size={15} />
        No hidden fees — the total above is exactly what you'll pay.
      </p>
    </div>
  );
}
