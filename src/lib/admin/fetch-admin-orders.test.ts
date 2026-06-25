import { describe, expect, it, vi, beforeEach } from "vitest";
import { buildOrdersQuery } from "./fetch-admin-orders";

vi.mock("@/lib/fetch/fetchRest", () => ({
  fetchWoo: vi.fn(),
}));

import { fetchWoo } from "@/lib/fetch/fetchRest";
import { fetchAdminOrders } from "./fetch-admin-orders";

const mockedFetchWoo = vi.mocked(fetchWoo);

describe("buildOrdersQuery", () => {
  it("builds a default paginated orders query", () => {
    const query = buildOrdersQuery();
    expect(query).toContain("orders?");
    expect(query).toContain("per_page=100");
    expect(query).toContain("page=1");
    expect(query).toContain("orderby=date");
    expect(query).toContain("order=desc");
  });

  it("includes optional filters", () => {
    const query = buildOrdersQuery(
      { status: "processing", search: "jane@example.com" },
      2,
    );

    expect(query).toContain("status=processing");
    expect(query).toContain("search=jane%40example.com");
    expect(query).toContain("page=2");
  });
});

describe("fetchAdminOrders", () => {
  beforeEach(() => {
    mockedFetchWoo.mockReset();
  });

  it("paginates until a short batch is returned", async () => {
    mockedFetchWoo
      .mockResolvedValueOnce(Array.from({ length: 100 }, (_, i) => ({ id: i })))
      .mockResolvedValueOnce([{ id: 100 }]);

    const orders = await fetchAdminOrders();

    expect(mockedFetchWoo).toHaveBeenCalledTimes(2);
    expect(orders).toHaveLength(101);
  });

  it("stops after max pages", async () => {
    mockedFetchWoo.mockResolvedValue(
      Array.from({ length: 100 }, (_, i) => ({ id: i })),
    );

    const orders = await fetchAdminOrders();

    expect(mockedFetchWoo).toHaveBeenCalledTimes(10);
    expect(orders).toHaveLength(1000);
  });
});
