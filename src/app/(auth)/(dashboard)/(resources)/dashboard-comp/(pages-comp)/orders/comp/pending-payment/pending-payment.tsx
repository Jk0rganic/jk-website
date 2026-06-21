"use client";

import Link from "next/link";
import displayStyles from "../order-display/styles.module.scss";

interface PendingPaymentBannerProps {
  orderId: number;
  total?: string;
  currency?: string;
}

export function PendingPaymentBanner({
  orderId,
  total,
  currency = "KES",
}: PendingPaymentBannerProps) {
  return (
    <div
      className={`${displayStyles.banner} ${displayStyles.banner_action}`}
      role="status"
    >
      <div className={displayStyles.content}>
        <p className={`${displayStyles.title} ${displayStyles.title_action}`}>
          Awaiting payment
        </p>
        <p className={displayStyles.message}>
          Complete M-Pesa payment
          {total ? ` of ${currency} ${total}` : ""} to confirm this order.
        </p>
      </div>
      <Link href={`/payment?orderId=${orderId}`} className={displayStyles.pay_btn}>
        Pay with M-Pesa
      </Link>
    </div>
  );
}

export function OrderPaidBanner() {
  return (
    <div
      className={`${displayStyles.banner} ${displayStyles.banner_success}`}
      role="status"
    >
      <div className={displayStyles.content}>
        <p className={`${displayStyles.title} ${displayStyles.title_success}`}>
          Payment received
        </p>
        <p className={displayStyles.message}>
          Your M-Pesa payment was received. We are preparing your order.
        </p>
      </div>
    </div>
  );
}

export function PendingPaymentLink({ orderId }: { orderId: number }) {
  return (
    <Link href={`/payment?orderId=${orderId}`} className={displayStyles.pay_link}>
      Pay now
    </Link>
  );
}
