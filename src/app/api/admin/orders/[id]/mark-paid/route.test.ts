import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/admin/require-admin", () => ({
  requireAdminSession: vi.fn(),
}));

vi.mock("@/lib/fetch/updateOrder", () => ({
  updateOrder: vi.fn(),
}));

vi.mock("@/lib/fetch/getOrder", () => ({
  getOrder: vi.fn(),
}));
vi.mock("@/lib/notifications/notify-new-order", () => ({
  notifyStaffOfNewOrder: vi.fn(),
}));

import { requireAdminSession } from "@/lib/admin/require-admin";
import { getOrder } from "@/lib/fetch/getOrder";
import { updateOrder } from "@/lib/fetch/updateOrder";
import { notifyStaffOfNewOrder } from "@/lib/notifications/notify-new-order";
import { POST } from "./route";

const mockedRequireAdminSession = vi.mocked(requireAdminSession);
const mockedGetOrder = vi.mocked(getOrder);
const mockedUpdateOrder = vi.mocked(updateOrder);
const mockedNotifyStaff = vi.mocked(notifyStaffOfNewOrder);
const adminSession = {
  user: { id: "1", email: "admin@jk.test", role: "min_admin" },
} as never;

describe("POST /api/admin/orders/[id]/mark-paid", () => {
  beforeEach(() => {
    mockedRequireAdminSession.mockReset();
    mockedUpdateOrder.mockReset();
    mockedNotifyStaff.mockReset();
    mockedRequireAdminSession.mockResolvedValue({
      error: null,
      status: 200,
      session: adminSession,
    });
    mockedGetOrder.mockResolvedValue({
      id: 42,
      status: "pending",
      payment_method: "intasend",
      needs_payment: true,
      date_paid: null,
    });
  });

  it("requires an admin session", async () => {
    mockedRequireAdminSession.mockResolvedValue({
      error: "Unauthorized",
      status: 401,
      session: null,
    });

    const response = await POST(
      new Request("http://test.local/api/admin/orders/42/mark-paid", {
        method: "POST",
        body: JSON.stringify({ transactionRef: "MPESA123" }),
      }),
      { params: Promise.resolve({ id: "42" }) },
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
    expect(mockedUpdateOrder).not.toHaveBeenCalled();
  });

  it("rejects blank transaction refs", async () => {
    const response = await POST(
      new Request("http://test.local/api/admin/orders/42/mark-paid", {
        method: "POST",
        body: JSON.stringify({ transactionRef: "   " }),
      }),
      { params: Promise.resolve({ id: "42" }) },
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: "Invalid transaction reference",
    });
    expect(mockedUpdateOrder).not.toHaveBeenCalled();
  });

  it("marks a Woo order paid with manual payment metadata", async () => {
    const order = {
      id: 42,
      status: "processing",
      transaction_id: "MPESA123",
      date_paid: "2026-07-16T10:00:00",
    };
    mockedUpdateOrder.mockResolvedValue(order);

    const response = await POST(
      new Request("http://test.local/api/admin/orders/42/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionRef: " MPESA123 ",
          note: "Confirmed on till statement",
        }),
      }),
      { params: Promise.resolve({ id: "42" }) },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ order });
    expect(mockedUpdateOrder).toHaveBeenCalledWith(42, {
      status: "processing",
      set_paid: true,
      transaction_id: "MPESA123",
      meta_data: [
        { key: "_jk_manual_payment_ref", value: "MPESA123" },
        {
          key: "_jk_manual_payment_note",
          value: "Confirmed on till statement",
        },
      ],
    });
    expect(mockedNotifyStaff).toHaveBeenCalledWith(order);
  });

  it("rejects orders that are not awaiting online payment", async () => {
    mockedGetOrder.mockResolvedValue({
      id: 42,
      status: "completed",
      payment_method: "intasend",
      needs_payment: false,
      date_paid: "2026-07-03T08:00:00",
    });

    const response = await POST(
      new Request("http://test.local/api/admin/orders/42/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionRef: "MPESA123" }),
      }),
      { params: Promise.resolve({ id: "42" }) },
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "Order is not awaiting online payment",
    });
    expect(mockedUpdateOrder).not.toHaveBeenCalled();
  });
});
