import { beforeEach, describe, expect, it, vi } from "vitest";
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

  it("includes supported date filters without sending an unsupported date type parameter", () => {
    const query = buildOrdersQuery({
      status: "completed",
      after: "2026-07-01T00:00:00.000Z",
      before: "2026-07-03T12:00:00.000Z",
      dateType: "paid",
    });

    expect(query).toContain("status=completed");
    expect(query).toContain("after=2026-07-01T00%3A00%3A00.000Z");
    expect(query).toContain("before=2026-07-03T12%3A00%3A00.000Z");
    expect(query).not.toContain("dates_are");
    expect(query).not.toContain("dateType");
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
