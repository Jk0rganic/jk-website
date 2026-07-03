import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/admin/require-admin", () => ({
  requireAdminSession: vi.fn(),
}));

vi.mock("@/lib/intasend/start-order-payment", () => ({
  startOrderPayment: vi.fn(),
}));

import { requireAdminSession } from "@/lib/admin/require-admin";
import { startOrderPayment } from "@/lib/intasend/start-order-payment";
import { POST } from "./route";

const mockedRequireAdminSession = vi.mocked(requireAdminSession);
const mockedStartOrderPayment = vi.mocked(startOrderPayment);
const adminSession = {
  user: { id: "1", email: "admin@jk.test", role: "min_admin" },
} as never;

describe("POST /api/admin/orders/[id]/payment-prompt", () => {
  beforeEach(() => {
    mockedRequireAdminSession.mockReset();
    mockedStartOrderPayment.mockReset();
    mockedRequireAdminSession.mockResolvedValue({
      error: null,
      status: 200,
      session: adminSession,
    });
  });

  it("requires an admin session", async () => {
    mockedRequireAdminSession.mockResolvedValue({
      error: "Unauthorized",
      status: 401,
      session: null,
    });

    const response = await POST(
      new Request("http://test.local/api/admin/orders/42/payment-prompt", {
        method: "POST",
      }),
      { params: Promise.resolve({ id: "42" }) },
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
    expect(mockedStartOrderPayment).not.toHaveBeenCalled();
  });

  it("rejects invalid order ids", async () => {
    const response = await POST(
      new Request("http://test.local/api/admin/orders/nope/payment-prompt", {
        method: "POST",
      }),
      { params: Promise.resolve({ id: "nope" }) },
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid order id" });
    expect(mockedStartOrderPayment).not.toHaveBeenCalled();
  });

  it("starts an order payment prompt", async () => {
    mockedStartOrderPayment.mockResolvedValue({
      checkoutId: "inv_123",
      invoiceId: "inv_123",
      orderId: 42,
    });

    const response = await POST(
      new Request("http://test.local/api/admin/orders/42/payment-prompt", {
        method: "POST",
      }),
      { params: Promise.resolve({ id: "42" }) },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      checkoutId: "inv_123",
      invoiceId: "inv_123",
      orderId: 42,
    });
    expect(mockedStartOrderPayment).toHaveBeenCalledWith(42);
  });
});
