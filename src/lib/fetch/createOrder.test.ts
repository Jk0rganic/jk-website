import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./fetchRest", () => ({
  fetchWoo: vi.fn(),
}));

import { createOrder } from "./createOrder";
import { fetchWoo } from "./fetchRest";

const mockedFetchWoo = vi.mocked(fetchWoo);

describe("createOrder", () => {
  beforeEach(() => {
    mockedFetchWoo.mockReset();
  });

  it("creates WooCommerce orders through the shared REST client", async () => {
    const payload = {
      payment_method: "cod",
      line_items: [{ product_id: 12, quantity: 2 }],
    };
    const order = { id: 99, status: "pending" };

    mockedFetchWoo.mockResolvedValue(order);

    await expect(createOrder(payload)).resolves.toBe(order);
    expect(mockedFetchWoo).toHaveBeenCalledWith("orders", {
      method: "POST",
      body: payload,
    });
  });
});
