import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/fetch/getOrder", () => ({
  getOrder: vi.fn(),
}));

vi.mock("@/lib/intasend/client", () => ({
  initiateMpesaStkPush: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    payment: {
      create: vi.fn(),
    },
  },
}));

import { getOrder } from "@/lib/fetch/getOrder";
import { initiateMpesaStkPush } from "@/lib/intasend/client";
import prisma from "@/lib/prisma";
import { startOrderPayment } from "./start-order-payment";

const mockedGetOrder = vi.mocked(getOrder);
const mockedInitiateMpesaStkPush = vi.mocked(initiateMpesaStkPush);
const mockedPaymentCreate = vi.mocked(prisma.payment.create);

describe("startOrderPayment", () => {
  beforeEach(() => {
    mockedGetOrder.mockReset();
    mockedInitiateMpesaStkPush.mockReset();
    mockedPaymentCreate.mockReset();
  });

  it("starts an M-Pesa STK prompt and records the pending payment", async () => {
    mockedGetOrder.mockResolvedValue({
      id: 42,
      total: "1250.40",
      status: "pending",
      payment_method: "intasend",
      needs_payment: true,
      date_paid: null,
      billing: { phone: "0712 345 678" },
    });
    mockedInitiateMpesaStkPush.mockResolvedValue({
      invoice: { invoice_id: "inv_123" },
    } as Awaited<ReturnType<typeof initiateMpesaStkPush>>);

    await expect(startOrderPayment(42)).resolves.toEqual({
      checkoutId: "inv_123",
      invoiceId: "inv_123",
      orderId: 42,
    });

    expect(mockedInitiateMpesaStkPush).toHaveBeenCalledWith({
      orderId: 42,
      amount: 1250.4,
      phone: "254712345678",
    });
    expect(mockedPaymentCreate).toHaveBeenCalledWith({
      data: {
        checkoutId: "inv_123",
        invoiceId: "inv_123",
        orderId: 42,
        amount: 1250,
        phoneNumber: "0712 345 678",
        status: "PENDING",
      },
    });
  });

  it("rejects orders without a payable amount", async () => {
    mockedGetOrder.mockResolvedValue({
      id: 42,
      total: "0",
      status: "pending",
      payment_method: "intasend",
      needs_payment: true,
      date_paid: null,
      billing: { phone: "0712345678" },
    });

    await expect(startOrderPayment(42)).rejects.toThrow("Invalid order amount");

    expect(mockedInitiateMpesaStkPush).not.toHaveBeenCalled();
    expect(mockedPaymentCreate).not.toHaveBeenCalled();
  });

  it("rejects orders without a billing phone number", async () => {
    mockedGetOrder.mockResolvedValue({
      id: 42,
      total: "1250",
      status: "pending",
      payment_method: "intasend",
      needs_payment: true,
      date_paid: null,
      billing: { phone: " " },
    });

    await expect(startOrderPayment(42)).rejects.toThrow(
      "Order is missing a billing phone number",
    );

    expect(mockedInitiateMpesaStkPush).not.toHaveBeenCalled();
    expect(mockedPaymentCreate).not.toHaveBeenCalled();
  });

  it("rejects orders that are not awaiting online payment", async () => {
    mockedGetOrder.mockResolvedValue({
      id: 42,
      total: "1250",
      status: "completed",
      payment_method: "intasend",
      needs_payment: false,
      date_paid: "2026-07-03T08:00:00",
      billing: { phone: "0712345678" },
    });

    await expect(startOrderPayment(42)).rejects.toThrow(
      "Order is not awaiting online payment",
    );

    expect(mockedInitiateMpesaStkPush).not.toHaveBeenCalled();
    expect(mockedPaymentCreate).not.toHaveBeenCalled();
  });
});
