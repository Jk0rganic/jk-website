import { describe, expect, it } from "vitest";
import {
  formatPaymentAmount,
  getPaymentStatusTone,
  summarizePayments,
} from "./payment-records";

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
