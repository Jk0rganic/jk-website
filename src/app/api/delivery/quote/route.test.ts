import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const { resolveDeliveryQuote } = vi.hoisted(() => ({
  resolveDeliveryQuote: vi.fn(),
}));
const { listActiveDeliveryAdminRates } = vi.hoisted(() => ({
  listActiveDeliveryAdminRates: vi.fn(),
}));

vi.mock("@/lib/delivery/delivery-quote", () => ({
  resolveDeliveryQuote,
}));
vi.mock("@/lib/delivery/admin-delivery-rates", () => ({
  listActiveDeliveryAdminRates,
}));

function request(body: unknown) {
  return new Request("http://localhost/api/delivery/quote", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/delivery/quote", () => {
  it("returns the authoritative delivery quote for shipping requests", async () => {
    listActiveDeliveryAdminRates.mockResolvedValueOnce([
      { code: "admin-nairobi", active: true },
    ]);
    resolveDeliveryQuote.mockReturnValueOnce({
      code: "admin-nairobi",
      fee: 350,
      label: "Nairobi door delivery",
      eta: "Today",
      fulfillmentType: "doorstep",
      freeDeliveryApplied: false,
      freeDeliveryRemaining: 0,
    });

    const response = await POST(
      request({
        deliveryMethod: "shipping",
        county: "Nairobi",
        cartSubtotal: 1800,
      }) as never,
    );

    await expect(response.json()).resolves.toEqual({
      code: "admin-nairobi",
      method: "shipping",
      fee: 350,
      label: "Nairobi door delivery",
      eta: "Today",
      fulfillmentType: "doorstep",
      freeDeliveryApplied: false,
      freeDeliveryRemaining: 0,
      available: true,
    });
    expect(resolveDeliveryQuote).toHaveBeenCalledWith(
      {
        deliveryMethod: "shipping",
        county: "Nairobi",
        cartSubtotal: 1800,
      },
      [{ code: "admin-nairobi", active: true }],
    );
  });
});
