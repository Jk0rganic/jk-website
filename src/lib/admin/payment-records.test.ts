import { describe, expect, it } from "vitest";
import {
  formatPaymentAmount,
  getPaymentStatusTone,
  getStalePendingPayments,
  type PaymentRecord,
  summarizePaymentAmounts,
  summarizePayments,
} from "./payment-records";

function payment(overrides: Partial<PaymentRecord>): PaymentRecord {
  return {
    id: "base",
    checkoutId: "checkout",
    orderId: 10,
    status: "PENDING",
    amount: 1000,
    phoneNumber: "0712345678",
    provider: "MPESA",
    failureReason: null,
    transactionRef: null,
    createdAt: new Date("2026-06-24T10:00:00Z"),
    updatedAt: new Date("2026-06-24T10:00:00Z"),
    ...overrides,
  };
}

describe("summarizePayments", () => {
  it("counts payment statuses", () => {
    const summary = summarizePayments([
      {
        id: "1",
        checkoutId: "c1",
        orderId: 10,
        status: "COMPLETE",
        amount: 1000,
        phoneNumber: "0712345678",
        provider: "MPESA",
        failureReason: null,
        transactionRef: "abc",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2",
        checkoutId: "c2",
        orderId: 11,
        status: "PENDING",
        amount: 500,
        phoneNumber: "0799999999",
        provider: "MPESA",
        failureReason: null,
        transactionRef: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "3",
        checkoutId: "c3",
        orderId: 12,
        status: "FAILED",
        amount: 700,
        phoneNumber: "0788888888",
        provider: "MPESA",
        failureReason: "Timeout",
        transactionRef: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    expect(summary).toEqual({
      total: 3,
      completed: 1,
      pending: 1,
      failed: 1,
    });
  });
});

describe("getPaymentStatusTone", () => {
  it("maps statuses to UI tones", () => {
    expect(getPaymentStatusTone("COMPLETE")).toBe("success");
    expect(getPaymentStatusTone("PENDING")).toBe("pending");
    expect(getPaymentStatusTone("FAILED")).toBe("danger");
    expect(getPaymentStatusTone("UNKNOWN")).toBe("neutral");
  });
});

describe("formatPaymentAmount", () => {
  it("formats Kenyan shilling amounts", () => {
    expect(formatPaymentAmount(1500)).toBe("KSh 1,500");
  });
});

describe("summarizePaymentAmounts", () => {
  it("totals amounts by payment outcome and calculates success rate", () => {
    const summary = summarizePaymentAmounts([
      payment({ id: "1", status: "COMPLETE", amount: 1000 }),
      payment({ id: "2", status: "SUCCESS", amount: 500 }),
      payment({ id: "3", status: "PENDING", amount: 300 }),
      payment({ id: "4", status: "FAILED", amount: 200 }),
      payment({ id: "5", status: "CANCELLED", amount: 100 }),
    ]);

    expect(summary).toEqual({
      completedAmount: 1500,
      pendingAmount: 300,
      failedAmount: 300,
      successRate: 40,
    });
  });
});

describe("getStalePendingPayments", () => {
  it("returns pending-ish payments older than the threshold", () => {
    const now = new Date("2026-06-24T12:00:00Z");
    const stale = payment({
      id: "stale",
      status: "PROCESSING",
      createdAt: new Date("2026-06-24T10:45:00Z"),
    });

    const result = getStalePendingPayments(
      [
        stale,
        payment({
          id: "fresh",
          status: "PENDING",
          createdAt: new Date("2026-06-24T11:45:00Z"),
        }),
        payment({
          id: "complete",
          status: "COMPLETE",
          createdAt: new Date("2026-06-24T10:00:00Z"),
        }),
      ],
      now,
      30,
    );

    expect(result).toEqual([stale]);
  });
});
