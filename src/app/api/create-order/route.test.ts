import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const { createOrder, resolveDeliveryQuote, listActiveDeliveryAdminRates } =
  vi.hoisted(() => ({
    createOrder: vi.fn(),
    resolveDeliveryQuote: vi.fn(),
    listActiveDeliveryAdminRates: vi.fn(),
  }));

vi.mock("@/lib/fetch/createOrder", () => ({
  createOrder,
}));

vi.mock("@/lib/delivery/delivery-quote", () => ({
  resolveDeliveryQuote,
}));
vi.mock("@/lib/delivery/admin-delivery-rates", () => ({
  listActiveDeliveryAdminRates,
}));

function request(body: unknown) {
  return new Request("http://localhost/api/create-order", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const baseOrder = {
  billing: {
    first_name: "Jane",
    last_name: "Kamau",
    address_1: "River Road",
    city: "Nairobi",
    postcode: "",
    phone: "0712345678",
    email: "jane@example.com",
    country: "KE",
    state: "Nairobi",
  },
  shipping: {
    first_name: "Jane",
    last_name: "Kamau",
    address_1: "River Road",
    city: "Nairobi",
    postcode: "",
    phone: "0712345678",
    country: "KE",
    state: "Nairobi",
  },
  line_items: [
    {
      product_id: 12,
      sku: "TEA",
      name: "Tea",
      quantity: 2,
      subtotal: "1000.00",
      total: "1000.00",
      meta_data: [],
    },
  ],
  shipping_lines: [
    {
      method_id: "flat_rate",
      method_title: "Tampered free delivery",
      total: "0.00",
    },
  ],
  meta_data: [
    { key: "_delivery_type", value: "door_to_door" },
    { key: "_county", value: "Nairobi" },
  ],
};

describe("POST /api/create-order", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listActiveDeliveryAdminRates.mockResolvedValue([]);
  });

  it("recalculates shipping and corrects tampered shipping line fees before creating the order", async () => {
    resolveDeliveryQuote.mockReturnValueOnce({
      code: "nairobi-doorstep",
      fee: 350,
      label: "Nairobi door delivery",
      eta: "Today",
      fulfillmentType: "doorstep",
      freeDeliveryApplied: false,
      freeDeliveryRemaining: 0,
    });
    createOrder.mockResolvedValueOnce({ id: 123, total: "1350.00" });

    const response = await POST(request(baseOrder) as never);

    await expect(response.json()).resolves.toEqual({
      id: 123,
      total: "1350.00",
    });
    expect(resolveDeliveryQuote).toHaveBeenCalledWith(
      {
        deliveryMethod: "shipping",
        county: "Nairobi",
        cartSubtotal: 1000,
      },
      [],
    );
    expect(createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        shipping_lines: [
          expect.objectContaining({
            method_id: "flat_rate",
            method_title: "Nairobi door delivery",
            total: "350.00",
          }),
        ],
      }),
    );
  });

  it("forces pickup shipping lines to remain free without resolving a shipping quote", async () => {
    createOrder.mockResolvedValueOnce({ id: 124, total: "1000.00" });

    const response = await POST(
      request({
        ...baseOrder,
        shipping_lines: [
          {
            method_id: "local_pickup",
            method_title: "Local Pickup",
            total: "999.00",
          },
        ],
      }) as never,
    );

    expect(response.status).toBe(200);
    expect(resolveDeliveryQuote).not.toHaveBeenCalled();
    expect(createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        shipping_lines: [
          expect.objectContaining({
            method_id: "local_pickup",
            total: "0.00",
          }),
        ],
      }),
    );
  });
});
