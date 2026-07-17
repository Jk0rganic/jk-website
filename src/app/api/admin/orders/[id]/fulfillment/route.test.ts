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

import { requireAdminSession } from "@/lib/admin/require-admin";
import { getOrder } from "@/lib/fetch/getOrder";
import { updateOrder } from "@/lib/fetch/updateOrder";
import { PATCH } from "./route";

const mockedRequireAdminSession = vi.mocked(requireAdminSession);
const mockedGetOrder = vi.mocked(getOrder);
const mockedUpdateOrder = vi.mocked(updateOrder);
const adminSession = {
  user: {
    id: "1",
    name: "Jane Doe",
    email: "admin@jk.test",
    role: "min_admin",
  },
} as never;

function patchRequest(body: unknown) {
  return new Request("http://test.local/api/admin/orders/42/fulfillment", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/admin/orders/[id]/fulfillment", () => {
  beforeEach(() => {
    mockedRequireAdminSession.mockReset();
    mockedGetOrder.mockReset();
    mockedUpdateOrder.mockReset();
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

    const response = await PATCH(
      patchRequest({ fulfillmentStatus: "dispatched" }),
      {
        params: Promise.resolve({ id: "42" }),
      },
    );

    expect(response.status).toBe(401);
    expect(mockedUpdateOrder).not.toHaveBeenCalled();
  });

  it("rejects a stage that doesn't belong to the order's delivery type", async () => {
    mockedGetOrder.mockResolvedValue({
      id: 42,
      status: "processing",
      shipping_lines: [{ method_id: "local_pickup" }],
      meta_data: [],
    });

    const response = await PATCH(
      patchRequest({ fulfillmentStatus: "dispatched" }),
      {
        params: Promise.resolve({ id: "42" }),
      },
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: "Fulfillment status does not match this order's delivery type",
    });
    expect(mockedUpdateOrder).not.toHaveBeenCalled();
  });

  it("writes the fulfillment meta value and appends attribution history", async () => {
    mockedGetOrder.mockResolvedValue({
      id: 42,
      status: "processing",
      shipping_lines: [{ method_id: "flat_rate" }],
      meta_data: [
        {
          key: "_jk_fulfillment_history",
          value: JSON.stringify([
            { value: "preparing", by: "Amina", at: "2026-07-16T09:00:00.000Z" },
          ]),
        },
      ],
    });
    const updatedOrder = { id: 42, status: "processing" };
    mockedUpdateOrder.mockResolvedValue(updatedOrder);

    const response = await PATCH(
      patchRequest({ fulfillmentStatus: "dispatched" }),
      {
        params: Promise.resolve({ id: "42" }),
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ order: updatedOrder });

    const [orderId, payload] = mockedUpdateOrder.mock.calls[0];
    expect(orderId).toBe(42);
    expect(payload.meta_data?.[0]).toEqual({
      key: "_jk_fulfillment_status",
      value: "dispatched",
    });

    const historyMeta = payload.meta_data?.[1];
    expect(historyMeta?.key).toBe("_jk_fulfillment_history");
    expect(JSON.parse(historyMeta?.value ?? "")).toEqual([
      { value: "preparing", by: "Amina", at: "2026-07-16T09:00:00.000Z" },
      { value: "dispatched", by: "Jane Doe", at: expect.any(String) },
    ]);
  });
});
