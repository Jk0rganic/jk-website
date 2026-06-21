import type { IntaSendInvoiceState } from "./types";

export type PaymentFailureKind =
  | "cancelled"
  | "timeout"
  | "insufficient_balance"
  | "wrong_pin"
  | "busy"
  | "generic";

export interface PaymentFailureDetails {
  message: string;
  kind: PaymentFailureKind;
}

const DEFAULT_MESSAGE =
  "Payment was not completed. You can send a new M-Pesa prompt to try again.";

function matchReason(
  reason: string,
  patterns: RegExp[],
): boolean {
  return patterns.some((pattern) => pattern.test(reason));
}

export function getPaymentFailureDetails(
  failedReason?: string | null,
  state?: IntaSendInvoiceState | null,
): PaymentFailureDetails {
  if (state === "CANCELED") {
    return {
      kind: "cancelled",
      message:
        "You cancelled the M-Pesa payment. Tap below to send a new prompt.",
    };
  }

  const reason = failedReason?.trim().toLowerCase() ?? "";

  if (!reason) {
    return { kind: "generic", message: DEFAULT_MESSAGE };
  }

  if (
    matchReason(reason, [
      /cancel/,
      /cancelled/,
      /canceled/,
      /declined/,
      /\b1032\b/,
      /\btc108\b/,
      /request cancelled by user/,
    ])
  ) {
    return {
      kind: "cancelled",
      message:
        "You cancelled the M-Pesa payment. Tap below to send a new prompt.",
    };
  }

  if (
    matchReason(reason, [
      /timeout/,
      /timed out/,
      /expired/,
      /\b1037\b/,
      /\b1019\b/,
      /no response/,
      /cannot be reached/,
      /ds timeout/,
    ])
  ) {
    return {
      kind: "timeout",
      message:
        "The M-Pesa prompt timed out. Check your phone signal and try again.",
    };
  }

  if (
    matchReason(reason, [
      /insufficient/,
      /\b1\b/,
      /low balance/,
      /not enough/,
    ])
  ) {
    return {
      kind: "insufficient_balance",
      message:
        "Insufficient M-Pesa balance. Top up your account and try again.",
    };
  }

  if (matchReason(reason, [/wrong pin/, /\b2001\b/, /incorrect pin/])) {
    return {
      kind: "wrong_pin",
      message: "Incorrect M-Pesa PIN entered. Send a new prompt to try again.",
    };
  }

  if (
    matchReason(reason, [
      /transaction in progress/,
      /\b1001\b/,
      /system busy/,
      /\b26\b/,
    ])
  ) {
    return {
      kind: "busy",
      message:
        "M-Pesa is busy or you have another transaction in progress. Wait a moment, then try again.",
    };
  }

  return { kind: "generic", message: DEFAULT_MESSAGE };
}
