export type PaymentRecord = {
  id: string;
  checkoutId: string;
  orderId: number;
  status: string;
  amount: number;
  phoneNumber: string;
  provider: string | null;
  failureReason: string | null;
  transactionRef: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PaymentSummary = {
  total: number;
  pending: number;
  completed: number;
  failed: number;
};

export function summarizePayments(payments: PaymentRecord[]): PaymentSummary {
  return payments.reduce(
    (acc, payment) => {
      acc.total += 1;
      const status = payment.status.toUpperCase();

      if (status === "COMPLETE" || status === "COMPLETED" || status === "SUCCESS") {
        acc.completed += 1;
      } else if (status === "FAILED" || status === "CANCELLED") {
        acc.failed += 1;
      } else {
        acc.pending += 1;
      }

      return acc;
    },
    { total: 0, pending: 0, completed: 0, failed: 0 },
  );
}

export function formatPaymentAmount(amount: number): string {
  return `KSh ${amount.toLocaleString("en-KE")}`;
}

export function getPaymentStatusTone(
  status: string,
): "success" | "pending" | "danger" | "neutral" {
  const normalized = status.toUpperCase();

  if (
    normalized === "COMPLETE" ||
    normalized === "COMPLETED" ||
    normalized === "SUCCESS"
  ) {
    return "success";
  }

  if (normalized === "FAILED" || normalized === "CANCELLED") {
    return "danger";
  }

  if (normalized === "PENDING" || normalized === "PROCESSING") {
    return "pending";
  }

  return "neutral";
}
