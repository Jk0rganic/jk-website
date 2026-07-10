"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { getOrderRedirectPath } from "@/lib/checkout/get-order-redirect";

interface Props {
  orderId: number;
  orderStatus: string;
  paymentMethodTitle?: string;
}

export default function OrderPaymentStatusPoller({
  orderId,
  orderStatus,
  paymentMethodTitle,
}: Props) {
  const router = useRouter();
  const checkedRef = useRef(false);

  useEffect(() => {
    const isOnlinePayment = paymentMethodTitle === "Online Payment";
    const isPending = orderStatus === "pending";

    if (!isOnlinePayment || !isPending || checkedRef.current) return;

    checkedRef.current = true;

    const reconcile = async () => {
      try {
        const res = await fetch(
          `/api/intasend/status?orderId=${encodeURIComponent(String(orderId))}`,
        );
        const data = await res.json();

        if (!res.ok) return;

        if (data.status === "SUCCESS") {
          toast.success("Payment received for this order.");
          router.refresh();
          return;
        }

        if (data.status === "FAILED") {
          toast.error(
            data.failureMessage ||
              data.failureReason ||
              "Online payment was not completed.",
          );
        }
      } catch {
        // Silent fallback — cron will reconcile later.
      }
    };

    reconcile();
  }, [orderId, orderStatus, paymentMethodTitle, router]);

  return null;
}
