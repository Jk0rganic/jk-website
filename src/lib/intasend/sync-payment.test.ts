import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/fetch/updateOrder", () => ({ updateOrder: vi.fn() }));
vi.mock("@/lib/notifications/notify-new-order", () => ({
  notifyStaffOfNewOrder: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  default: { payment: { update: vi.fn() } },
}));

import { updateOrder } from "@/lib/fetch/updateOrder";
import { notifyStaffOfNewOrder } from "@/lib/notifications/notify-new-order";
import prisma from "@/lib/prisma";
import { syncPaymentFromInvoice } from "./sync-payment";

const mockedUpdateOrder = vi.mocked(updateOrder);
const mockedNotifyStaff = vi.mocked(notifyStaffOfNewOrder);
const mockedPaymentUpdate = vi.mocked(prisma.payment.update);

describe("syncPaymentFromInvoice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("emails staff after a newly successful payment updates the order", async () => {
    const paidOrder = {
      id: 42,
      status: "processing",
      date_paid: "2026-07-16T10:00:00",
    };
    mockedPaymentUpdate.mockResolvedValue({} as never);
    mockedUpdateOrder.mockResolvedValue(paidOrder);

    await expect(
      syncPaymentFromInvoice(
        { id: "pay-1", checkoutId: "inv-1", orderId: 42, status: "PENDING" },
        {
          invoice_id: "inv-1",
          state: "COMPLETE",
          provider: "MPESA",
          mpesa_reference: "ABC123",
        },
      ),
    ).resolves.toBe("SUCCESS");

    expect(mockedUpdateOrder).toHaveBeenCalledWith(
      42,
      expect.objectContaining({ set_paid: true }),
    );
    expect(mockedNotifyStaff).toHaveBeenCalledWith(paidOrder);
  });

  it("does not email again when the payment was already successful", async () => {
    await syncPaymentFromInvoice(
      { id: "pay-1", checkoutId: "inv-1", orderId: 42, status: "SUCCESS" },
      { invoice_id: "inv-1", state: "COMPLETE" },
    );

    expect(mockedUpdateOrder).not.toHaveBeenCalled();
    expect(mockedNotifyStaff).not.toHaveBeenCalled();
  });
});
