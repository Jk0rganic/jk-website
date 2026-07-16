import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/fetch/fetchRest", () => ({ fetchWoo: vi.fn() }));

import { fetchWoo } from "@/lib/fetch/fetchRest";
import { POST } from "./route";

const mockedFetchWoo = vi.mocked(fetchWoo);

describe("POST /api/reviews", () => {
  beforeEach(() => mockedFetchWoo.mockReset());

  it("creates a rated WooCommerce product review", async () => {
    mockedFetchWoo.mockResolvedValue({ id: 91, status: "hold" });
    const response = await POST(
      new Request("http://localhost/api/reviews", {
        method: "POST",
        body: JSON.stringify({
          productId: 77,
          reviewer: "Faith",
          reviewerEmail: "faith@example.com",
          review: "Lovely product",
          rating: 5,
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(mockedFetchWoo).toHaveBeenCalledWith("products/reviews", {
      method: "POST",
      body: {
        product_id: 77,
        reviewer: "Faith",
        reviewer_email: "faith@example.com",
        review: "Lovely product",
        rating: 5,
      },
      noCache: true,
    });
  });

  it("rejects reviews without a star rating", async () => {
    const response = await POST(
      new Request("http://localhost/api/reviews", {
        method: "POST",
        body: JSON.stringify({
          productId: 77,
          reviewer: "Faith",
          reviewerEmail: "faith@example.com",
          review: "Lovely product",
          rating: 0,
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(mockedFetchWoo).not.toHaveBeenCalled();
  });
});
