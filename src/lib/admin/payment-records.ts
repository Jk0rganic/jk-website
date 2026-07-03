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

export type PaymentAmountSummary = {
  completedAmount: number;
  pendingAmount: number;
  failedAmount: number;
  successRate: number;
};

function isCompletedStatus(status: string): boolean {
  const normalized = status.toUpperCase();
  return (
    normalized === "COMPLETE" ||
    normalized === "COMPLETED" ||
    normalized === "SUCCESS"
  );
}

function isFailedStatus(status: string): boolean {
  const normalized = status.toUpperCase();
  return normalized === "FAILED" || normalized === "CANCELLED";
}

function isPendingStatus(status: string): boolean {
  return !isCompletedStatus(status) && !isFailedStatus(status);
}

export function summarizePayments(payments: PaymentRecord[]): PaymentSummary {
  return payments.reduce(
    (acc, payment) => {
      acc.total += 1;

      if (isCompletedStatus(payment.status)) {
        acc.completed += 1;
      } else if (isFailedStatus(payment.status)) {
        acc.failed += 1;
      } else {
        acc.pending += 1;
      }

      return acc;
    },
    { total: 0, pending: 0, completed: 0, failed: 0 },
  );
}

export function summarizePaymentAmounts(
  payments: PaymentRecord[],
): PaymentAmountSummary {
  const summary = payments.reduce(
    (acc, payment) => {
      if (isCompletedStatus(payment.status)) {
        acc.completedAmount += payment.amount;
        acc.completedCount += 1;
      } else if (isFailedStatus(payment.status)) {
        acc.failedAmount += payment.amount;
      } else {
        acc.pendingAmount += payment.amount;
      }

      return acc;
    },
    {
      completedAmount: 0,
      pendingAmount: 0,
      failedAmount: 0,
      completedCount: 0,
    },
  );

  return {
    completedAmount: summary.completedAmount,
    pendingAmount: summary.pendingAmount,
    failedAmount: summary.failedAmount,
    successRate: payments.length
      ? (summary.completedCount / payments.length) * 100
      : 0,
  };
}

export function getStalePendingPayments(
  payments: PaymentRecord[],
  now: Date,
  thresholdMinutes: number,
): PaymentRecord[] {
  const thresholdMs = thresholdMinutes * 60 * 1000;

  return payments.filter((payment) => {
    if (!isPendingStatus(payment.status)) return false;

    return now.getTime() - new Date(payment.createdAt).getTime() > thresholdMs;
  });
}

export function formatPaymentAmount(amount: number): string {
  return `KSh ${amount.toLocaleString("en-KE")}`;
}

export function getPaymentStatusTone(
  status: string,
): "success" | "pending" | "danger" | "neutral" {
  const normalized = status.toUpperCase();

  if (isCompletedStatus(normalized)) {
    return "success";
  }

  if (isFailedStatus(normalized)) {
    return "danger";
  }

  if (normalized === "PENDING" || normalized === "PROCESSING") {
    return "pending";
  }

  return "neutral";
}
