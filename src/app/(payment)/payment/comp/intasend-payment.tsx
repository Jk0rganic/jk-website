"use client";

import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import PaymentDetails from "@/comp/payment-details/payment-details";
import Section from "@/comp/section/section";
import { getOrderRedirectPath } from "@/lib/checkout/get-order-redirect";
import type { PaymentFailureKind } from "@/lib/intasend/get-payment-failure-message";
import { getPollIntervalMs } from "@/lib/intasend/poll-config";
import k from "./styles.module.scss";

type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";

type FetchStatusResult = StatusResponse | "NOT_FOUND";

interface StatusResponse {
  status: PaymentStatus;
  orderId: number;
  checkoutId: string;
  invoiceId?: string | null;
  transactionRef?: string | null;
  provider?: string | null;
  failureReason?: string | null;
  failureMessage?: string | null;
  failureKind?: PaymentFailureKind | null;
  amount: number;
  phoneNumber?: string;
}

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
  const [timedOut, setTimedOut] = useState(false);
  const [userMessage, setUserMessage] = useState<string | null>(null);
  const [failureKind, setFailureKind] = useState<PaymentFailureKind | null>(
    null,
  );
  const [transactionRef, setTransactionRef] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [needsPaymentStart, setNeedsPaymentStart] = useState(false);

  const notifiedRef = useRef(false);
  const terminalRef = useRef(false);
  const startedAtRef = useRef(Date.now());
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timedOutRef = useRef(false);

  const clearPollTimer = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const notifyOnce = useCallback(
    (type: "success" | "error", message: string) => {
      if (notifiedRef.current) return;
      notifiedRef.current = true;
      if (type === "success") toast.success(message);
      else toast.error(message, { duration: 6000 });
    },
    [],
  );

  const applyStatusResponse = useCallback((data: StatusResponse) => {
    setAmount(data.amount);
    setPhoneNumber(data.phoneNumber ?? null);
    setStatus(data.status);
    setUserMessage(data.failureMessage ?? data.failureReason ?? null);
    setFailureKind(data.failureKind ?? null);
    setTransactionRef(data.transactionRef ?? null);
    setProvider(data.provider ?? null);
    return data;
  }, []);

  const handleSuccess = useCallback(
    (data: StatusResponse) => {
      terminalRef.current = true;
      setTimedOut(false);
      timedOutRef.current = false;
      notifyOnce(
        "success",
        data.transactionRef
          ? `Payment received — reference ${data.transactionRef}`
          : "Payment received successfully!",
      );

      fetch("/api/session")
        .then((res) => res.json())
        .then(() => {
          router.push(getOrderRedirectPath(data.orderId, true));
        })
        .catch(() => {
          router.push(getOrderRedirectPath(data.orderId, true));
        });
    },
    [notifyOnce, router],
  );

  const handleFailed = useCallback(
    (data: StatusResponse) => {
      terminalRef.current = true;
      setTimedOut(false);
      timedOutRef.current = false;
      notifyOnce(
        "error",
        data.failureMessage ||
          data.failureReason ||
          "Payment was not completed.",
      );
    },
    [notifyOnce],
  );

  const fetchStatus =
    useCallback(async (): Promise<FetchStatusResult | null> => {
      if (!orderId) return null;

      const query = checkoutId
        ? `checkoutId=${encodeURIComponent(checkoutId)}`
        : `orderId=${encodeURIComponent(orderId)}`;

      const res = await fetch(`/api/intasend/status?${query}`);
      const data = (await res.json()) as StatusResponse;

      if (res.status === 404) {
        return "NOT_FOUND";
      }

      if (!res.ok) {
        throw new Error(
          (data as { message?: string }).message ||
            "Could not check payment status.",
        );
      }

      return applyStatusResponse(data);
    }, [applyStatusResponse, checkoutId, orderId]);

  const pollStatus = useCallback(async () => {
    if (!orderId || terminalRef.current) return;

    try {
      const data = await fetchStatus();
      if (!data) return;

      if (data === "NOT_FOUND") {
        terminalRef.current = true;
        setNeedsPaymentStart(true);
        setStatus("PENDING");
        setUserMessage(
          "Payment has not been started for this order. Send an M-Pesa prompt to pay.",
        );
        return;
      }

      if (data.status === "SUCCESS") {
        handleSuccess(data);
        return;
      }

      if (data.status === "FAILED") {
        handleFailed(data);
        return;
      }

      const elapsed = Date.now() - startedAtRef.current;
      const nextInterval = getPollIntervalMs(elapsed);

      if (nextInterval === null) {
        terminalRef.current = true;
        timedOutRef.current = true;
        setTimedOut(true);
        setStatus("PENDING");
        setUserMessage(
          "Automatic checks paused. Use “Check payment status” if you already paid.",
        );
        return;
      }

      clearPollTimer();
      pollTimerRef.current = setTimeout(() => {
        void pollStatus();
      }, nextInterval);
    } catch (error) {
      const elapsed = Date.now() - startedAtRef.current;
      const nextInterval = getPollIntervalMs(elapsed);

      if (nextInterval === null) {
        terminalRef.current = true;
        timedOutRef.current = true;
        setTimedOut(true);
        setStatus("PENDING");
        setUserMessage("Unable to verify payment status. Try checking again.");
        notifyOnce(
          "error",
          "Unable to verify payment status. Try checking again.",
        );
        return;
      }

      clearPollTimer();
      pollTimerRef.current = setTimeout(() => {
        void pollStatus();
      }, nextInterval);
    }
  }, [
    clearPollTimer,
    fetchStatus,
    handleFailed,
    handleSuccess,
    notifyOnce,
    orderId,
  ]);

  const resumePolling = useCallback(() => {
    clearPollTimer();
    notifiedRef.current = false;
    terminalRef.current = false;
    timedOutRef.current = false;
    startedAtRef.current = Date.now();
    setTimedOut(false);
    setNeedsPaymentStart(false);
    setStatus("PENDING");
    setUserMessage(null);
    setFailureKind(null);
    void pollStatus();
  }, [clearPollTimer, pollStatus]);

  const handleCheckStatus = async () => {
    if (!orderId) return;

    setIsChecking(true);
    clearPollTimer();
    notifiedRef.current = false;
    terminalRef.current = false;

    try {
      const data = await fetchStatus();
      if (!data) return;

      if (data === "NOT_FOUND") {
        setNeedsPaymentStart(true);
        terminalRef.current = true;
        setUserMessage(
          "Payment has not been started for this order. Send an M-Pesa prompt to pay.",
        );
        return;
      }

      if (data.status === "SUCCESS") {
        handleSuccess(data);
        return;
      }

      if (data.status === "FAILED") {
        handleFailed(data);
        return;
      }

      setTimedOut(false);
      setNeedsPaymentStart(false);
      setStatus("PENDING");
      setUserMessage(null);
      toast.message("Payment is still pending on M-Pesa.");
      resumePolling();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not check payment status.";
      toast.error(message);
    } finally {
      setIsChecking(false);
    }
  };

  const handleRetry = async () => {
    if (!orderId) {
      toast.error("Missing order details. Return to checkout and try again.");
      return;
    }

    setIsRetrying(true);

    try {
      const res = await fetch("/api/intasend/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: Number(orderId) }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      resumePolling();
      toast.success("M-Pesa prompt sent. Check your phone.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not restart payment.";
      toast.error(message);
      setStatus("FAILED");
      setUserMessage(message);
      setTimedOut(false);
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

    resumePolling();

    const onResume = () => {
      if (document.visibilityState !== "visible" || terminalRef.current) return;
      void fetchStatus().then((data) => {
        if (!data || data === "NOT_FOUND") return;
        if (data.status === "SUCCESS") {
          handleSuccess(data);
          return;
        }
        if (data.status === "FAILED") {
          handleFailed(data);
          return;
        }
        if (timedOutRef.current) {
          resumePolling();
        }
      });
    };

    document.addEventListener("visibilitychange", onResume);
    window.addEventListener("focus", onResume);

    return () => {
      clearPollTimer();
      document.removeEventListener("visibilitychange", onResume);
      window.removeEventListener("focus", onResume);
    };
  }, [
    clearPollTimer,
    fetchStatus,
    handleFailed,
    handleSuccess,
    orderId,
    resumePolling,
    router,
  ]);

  if (!orderId) {
    return null;
  }

  const showWaiting = status === "PENDING" && !timedOut && !needsPaymentStart;
  const showTimedOut = status === "PENDING" && timedOut && !needsPaymentStart;

  return (
    <Section className={k.payment_page}>
      <div className={k.card}>
        <h1>
          {status === "SUCCESS"
            ? "Payment received"
            : status === "FAILED"
              ? failureKind === "cancelled"
                ? "Payment cancelled"
                : "Payment not completed"
              : needsPaymentStart
                ? "Payment pending"
                : showTimedOut
                  ? "Still waiting for payment"
                  : "Waiting for payment"}
        </h1>

        <PaymentDetails
          phone={phoneNumber}
          amount={amount}
          orderId={orderId}
          transactionRef={status === "SUCCESS" ? transactionRef : null}
          provider={provider}
          className={k.summary}
        />

        {needsPaymentStart && (
          <>
            <p className={k.message}>
              {userMessage ||
                "Send an M-Pesa prompt to your phone to pay for this order."}
            </p>
            <div className={k.actions}>
              <button
                type="button"
                className={k.retry_btn}
                onClick={handleRetry}
                disabled={isRetrying}
              >
                {isRetrying ? "Sending…" : "Pay with M-Pesa"}
              </button>
              <button
                type="button"
                className={k.secondary_btn}
                onClick={() => router.push(`/account/orders/${orderId}`)}
              >
                Back to order
              </button>
            </div>
          </>
        )}

        {showWaiting && (
          <>
            <div className={k.spinner} aria-hidden />
            <p className={k.message}>
              Check your phone for the M-Pesa payment prompt and enter your PIN
              to complete payment.
            </p>
            <p className={k.hint}>
              This page updates automatically when M-Pesa reports your payment
              status.
            </p>
          </>
        )}

        {showTimedOut && (
          <>
            <p className={k.message}>{userMessage}</p>
            <p className={k.hint}>
              A background check also runs every few minutes if you leave this
              page.
            </p>
            <div className={k.actions}>
              <button
                type="button"
                className={k.retry_btn}
                onClick={handleCheckStatus}
                disabled={isChecking}
              >
                {isChecking ? "Checking…" : "Check payment status"}
              </button>
              <button
                type="button"
                className={k.secondary_btn}
                onClick={handleRetry}
                disabled={isRetrying}
              >
                {isRetrying ? "Sending…" : "Send M-Pesa prompt again"}
              </button>
            </div>
          </>
        )}

        {status === "SUCCESS" && (
          <p className={k.success}>
            Payment received. Redirecting to your order…
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
                className={k.check_btn}
                onClick={handleCheckStatus}
                disabled={isChecking}
              >
                {isChecking ? "Checking…" : "Check payment status"}
              </button>
              <button
                type="button"
                className={k.retry_btn}
                onClick={handleRetry}
                disabled={isRetrying}
              >
                {isRetrying ? "Sending…" : "Send M-Pesa prompt again"}
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
