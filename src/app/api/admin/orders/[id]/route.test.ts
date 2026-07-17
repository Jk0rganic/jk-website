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
  return new Request("http://test.local/api/admin/orders/42", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/admin/orders/[id]", () => {
  beforeEach(() => {
    mockedRequireAdminSession.mockReset();
    mockedGetOrder.mockReset();
    mockedUpdateOrder.mockReset();
    mockedRequireAdminSession.mockResolvedValue({
      error: null,
      status: 200,
      session: adminSession,
    });
    mockedGetOrder.mockResolvedValue({
      id: 42,
      status: "pending",
      meta_data: [],
    });
  });

  it("requires an admin session", async () => {
    mockedRequireAdminSession.mockResolvedValue({
      error: "Unauthorized",
      status: 401,
      session: null,
    });

    const response = await PATCH(patchRequest({ status: "processing" }), {
      params: Promise.resolve({ id: "42" }),
    });

    expect(response.status).toBe(401);
    expect(mockedUpdateOrder).not.toHaveBeenCalled();
  });

  it("rejects an invalid status value", async () => {
    const response = await PATCH(patchRequest({ status: "bogus" }), {
      params: Promise.resolve({ id: "42" }),
    });

    expect(response.status).toBe(400);
    expect(mockedUpdateOrder).not.toHaveBeenCalled();
  });

  it("updates the order status and records who made the change", async () => {
    const updatedOrder = { id: 42, status: "processing" };
    mockedUpdateOrder.mockResolvedValue(updatedOrder);

    const response = await PATCH(patchRequest({ status: "processing" }), {
      params: Promise.resolve({ id: "42" }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ order: updatedOrder });

    const [orderId, payload] = mockedUpdateOrder.mock.calls[0];
    expect(orderId).toBe(42);
    expect(payload.status).toBe("processing");

    const historyMeta = payload.meta_data?.[0];
    expect(historyMeta?.key).toBe("_jk_status_history");
    expect(JSON.parse(historyMeta?.value ?? "")).toEqual([
      { value: "processing", by: "Jane Doe", at: expect.any(String) },
    ]);
  });
});
