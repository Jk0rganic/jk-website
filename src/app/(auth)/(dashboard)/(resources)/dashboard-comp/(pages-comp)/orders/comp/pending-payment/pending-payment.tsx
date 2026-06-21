"use client";

import Link from "next/link";
import k from "./styles.module.scss";

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
    <div className={k.banner} role="status">
      <div className={k.content}>
        <p className={k.title}>Payment pending</p>
        <p className={k.message}>
          This order is waiting for M-Pesa payment
          {total ? ` of ${currency} ${total}` : ""}. Complete payment to
          confirm your order.
        </p>
      </div>
      <Link href={`/payment?orderId=${orderId}`} className={k.pay_btn}>
        Pay with M-Pesa
      </Link>
    </div>
  );
}

export function PendingPaymentLink({ orderId }: { orderId: number }) {
  return (
    <Link href={`/payment?orderId=${orderId}`} className={k.pay_link}>
      Pay now
    </Link>
  );
}
