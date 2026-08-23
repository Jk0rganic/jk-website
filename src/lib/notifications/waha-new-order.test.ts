import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  buildNewOrderWhatsAppMessage,
  sendNewOrderWhatsAppNotification,
} from "./waha-new-order";

const baseOrder: WooOrderResponse = {
  id: 501,
  status: "processing",
  total: "1350.00",
  currency: "KES",
  currency_symbol: "KSh",
  payment_method: "intasend",
  payment_method_title: "Online Payment",
  customer_note: "",
  date_created: "2026-07-12T10:00:00",
  date_paid: "2026-07-12T10:05:00",
  date_completed: null,
  needs_payment: false,
  needs_processing: true,
  payment_url: "",
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
      method_title: "Nairobi door delivery",
      total: "350.00",
    },
  ],
  meta_data: [],
};

const originalEnv = { ...process.env };

describe("WAHA paid-order notifications", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
    delete process.env.WAHA_URL;
    delete process.env.WAHA_API_KEY;
    delete process.env.WAHA_SESSION;
    delete process.env.WAHA_ORDER_GROUP_ID;
    process.env.NEXT_PUBLIC_APP_URL = "https://shop.example.com";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("builds a concise order message with fulfilment details", () => {
    const message = buildNewOrderWhatsAppMessage(baseOrder);

    expect(message).toContain("New paid order #501");
    expect(message).toContain("Jane Kamau");
    expect(message).toContain("2 × Tea");
    expect(message).toContain("KSh1350.00");
    expect(message).toContain(
      "https://shop.example.com/admin-account/orders/501",
    );
  });

  it("is disabled without any WAHA configuration", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    await expect(sendNewOrderWhatsAppNotification(baseOrder)).resolves.toEqual({
      status: "disabled",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends the notification to the configured group", async () => {
    process.env.WAHA_URL = "https://waha.example.com/";
    process.env.WAHA_API_KEY = "secret";
    process.env.WAHA_SESSION = "orders";
    process.env.WAHA_ORDER_GROUP_ID = "123456@g.us";
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 201 }));

    await expect(sendNewOrderWhatsAppNotification(baseOrder)).resolves.toEqual({
      status: "sent",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://waha.example.com/api/sendText",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "X-Api-Key": "secret" }),
      }),
    );
    const request = fetchMock.mock.calls[0]?.[1];
    expect(JSON.parse(String(request?.body))).toEqual(
      expect.objectContaining({
        session: "orders",
        chatId: "123456@g.us",
      }),
    );
  });

  it("reports incomplete configuration", async () => {
    process.env.WAHA_URL = "https://waha.example.com";

    await expect(sendNewOrderWhatsAppNotification(baseOrder)).rejects.toThrow(
      "must all be configured",
    );
  });

  it("reports unsuccessful WAHA responses", async () => {
    process.env.WAHA_URL = "https://waha.example.com";
    process.env.WAHA_API_KEY = "secret";
    process.env.WAHA_ORDER_GROUP_ID = "123456@g.us";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("session stopped", { status: 503 }),
    );

    await expect(sendNewOrderWhatsAppNotification(baseOrder)).rejects.toThrow(
      "WAHA returned 503: session stopped",
    );
  });
});
