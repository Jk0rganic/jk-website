"use client";

import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import PaymentDetails from "@/comp/payment-details/payment-details";
import Section from "@/comp/section/section";
import { getOrderRedirectPath } from "@/lib/checkout/get-order-redirect";
import k from "./styles.module.scss";

type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";

interface StatusResponse {
  status: PaymentStatus;
  orderId: number;
  checkoutId: string;
  invoiceId?: string | null;
  transactionRef?: string | null;
  provider?: string | null;
  failureReason?: string | null;
  amount: number;
  phoneNumber?: string;
}

const POLL_INTERVAL_MS = 3000;
const TIMEOUT_MS = 180_000;

export default function IntaSendPayment({
  searchParams,
}: {
  searchParams: Promise<{
    orderId?: string;
    checkoutId?: string;
  }>;
}) {
  const { orderId, checkoutId } = use(searchParams);
  const router = useRouter();
  const [status, setStatus] = useState<PaymentStatus>("PENDING");
  const [userMessage, setUserMessage] = useState<string | null>(null);
  const [transactionRef, setTransactionRef] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const notifiedRef = useRef(false);
  const terminalRef = useRef(false);
  const startedAtRef = useRef(Date.now());

  const notifyOnce = useCallback((type: "success" | "error", message: string) => {
    if (notifiedRef.current) return;
    notifiedRef.current = true;
    if (type === "success") toast.success(message);
    else toast.error(message, { duration: 6000 });
  }, []);

  const handleTerminalStatus = useCallback(
    (data: StatusResponse) => {
      if (terminalRef.current) return;

      setStatus(data.status);
      setUserMessage(data.failureReason ?? null);
      setTransactionRef(data.transactionRef ?? null);
      setProvider(data.provider ?? null);

      if (data.status === "SUCCESS") {
        terminalRef.current = true;
        notifyOnce(
          "success",
          data.transactionRef
            ? `Payment received — reference ${data.transactionRef}`
            : "Payment received successfully!",
        );

        fetch("/api/session")
          .then((res) => res.json())
          .then((session) => {
            const isLoggedIn = Boolean(session?.user?.email);
            router.push(getOrderRedirectPath(data.orderId, isLoggedIn));
          })
          .catch(() => {
            router.push(getOrderRedirectPath(data.orderId, false));
          });
        return;
      }

      if (data.status === "FAILED") {
        terminalRef.current = true;
        notifyOnce(
          "error",
          data.failureReason || "Payment was not completed.",
        );
      }
    },
    [notifyOnce, router],
  );

  const pollStatus = useCallback(async () => {
    if (!orderId || terminalRef.current) return;

    const query = checkoutId
      ? `checkoutId=${encodeURIComponent(checkoutId)}`
      : `orderId=${encodeURIComponent(orderId)}`;

    try {
      const res = await fetch(`/api/intasend/status?${query}`);
      const data = (await res.json()) as StatusResponse;

      if (!res.ok) {
        if (!notifiedRef.current) {
          toast.error(
            (data as { message?: string }).message ||
              "Could not check payment status.",
          );
        }
        return;
      }

      setAmount(data.amount);
      setPhoneNumber(data.phoneNumber ?? null);
      handleTerminalStatus(data);

      if (
        !terminalRef.current &&
        Date.now() - startedAtRef.current >= TIMEOUT_MS
      ) {
        terminalRef.current = true;
        setStatus("FAILED");
        const timeoutMessage =
          "Payment verification timed out. If you completed payment, check your order page shortly.";
        setUserMessage(timeoutMessage);
        notifyOnce("error", timeoutMessage);
      }
    } catch {
      if (!terminalRef.current && Date.now() - startedAtRef.current >= TIMEOUT_MS) {
        terminalRef.current = true;
        setStatus("FAILED");
        const message = "Unable to verify payment status. Please try again.";
        setUserMessage(message);
        notifyOnce("error", message);
      }
    }
  }, [checkoutId, handleTerminalStatus, notifyOnce, orderId]);

  const handleRetry = async () => {
    if (!orderId) {
      toast.error("Missing order details. Return to checkout and try again.");
      return;
    }

    setIsRetrying(true);
    notifiedRef.current = false;
    terminalRef.current = false;
    startedAtRef.current = Date.now();
    setStatus("PENDING");
    setUserMessage(null);

    try {
      const res = await fetch("/api/intasend/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: Number(orderId) }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      throw new Error("No checkout URL returned");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not restart payment.";
      toast.error(message);
      setStatus("FAILED");
      setUserMessage(message);
      terminalRef.current = true;
      notifiedRef.current = true;
    } finally {
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    if (!orderId) {
      toast.error("Invalid payment session. Please checkout again.");
      router.replace("/checkout");
      return;
    }

    pollStatus();
    const interval = setInterval(pollStatus, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [orderId, pollStatus, router]);

  if (!orderId) {
    return null;
  }

  return (
    <Section className={k.payment_page}>
      <div className={k.card}>
        <h1>
          {status === "SUCCESS"
            ? "Payment received"
            : status === "FAILED"
              ? "Payment not completed"
              : "Confirming payment"}
        </h1>

        <PaymentDetails
          phone={phoneNumber}
          amount={amount}
          orderId={orderId}
          transactionRef={status === "SUCCESS" ? transactionRef : null}
          provider={provider}
          className={k.summary}
        />

        {status === "PENDING" && (
          <>
            <div className={k.spinner} aria-hidden />
            <p className={k.message}>
              We are confirming your payment. This usually takes a few seconds
              after you complete checkout on IntaSend.
            </p>
            <p className={k.hint}>
              If you have not paid yet, return to checkout and try again.
            </p>
          </>
        )}

        {status === "SUCCESS" && (
          <p className={k.success}>
            Payment confirmed. Redirecting to your order…
          </p>
        )}

        {status === "FAILED" && (
          <>
            <p className={k.error} role="alert">
              {userMessage || "Payment was not completed."}
            </p>
            <div className={k.actions}>
              <button
                type="button"
                className={k.retry_btn}
                onClick={handleRetry}
                disabled={isRetrying}
              >
                {isRetrying ? "Redirecting…" : "Try payment again"}
              </button>
              <button
                type="button"
                className={k.secondary_btn}
                onClick={() => router.push("/checkout")}
              >
                Return to checkout
              </button>
            </div>
          </>
        )}
      </div>
    </Section>
  );
}
