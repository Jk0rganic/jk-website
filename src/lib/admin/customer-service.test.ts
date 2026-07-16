import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/fetch/fetchRest", () => ({ fetchWoo: vi.fn() }));

import { fetchWoo } from "@/lib/fetch/fetchRest";
import {
  buildCustomerDirectory,
  fetchAdminCustomers,
} from "./customer-service";

const mockedFetchWoo = vi.mocked(fetchWoo);

describe("customer service", () => {
  beforeEach(() => mockedFetchWoo.mockReset());

  it("merges registered customers with real orders and includes guest buyers", () => {
    const result = buildCustomerDirectory(
      [
        {
          id: 4,
          email: "amina@example.com",
          first_name: "Amina",
          last_name: "Yusuf",
          date_created: "2026-06-01",
          billing: { phone: "0700", city: "Nairobi", state: "Westlands" },
        },
      ],
      [
        {
          id: 10,
          status: "completed",
          total: "1200",
          date_created: "2026-07-02T10:00:00",
          customer_id: 4,
          billing: {
            email: "AMINA@example.com",
            first_name: "Amina",
            last_name: "Yusuf",
            phone: "0711",
            city: "Nairobi",
            state: "Kilimani",
          },
        },
        {
          id: 11,
          status: "processing",
          total: "800",
          date_created: "2026-07-05T10:00:00",
          customer_id: 0,
          billing: {
            email: "guest@example.com",
            first_name: "Guest",
            last_name: "Buyer",
            phone: "0722",
            city: "Mombasa",
            state: "Nyali",
          },
        },
        {
          id: 12,
          status: "cancelled",
          total: "9999",
          date_created: "2026-07-06T10:00:00",
          customer_id: 4,
          billing: { email: "amina@example.com" },
        },
      ],
      new Date("2026-07-16T00:00:00Z"),
    );

    expect(result.customers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "4",
          name: "Amina Yusuf",
          orders: 1,
          spend: 1200,
          phone: "0711",
          location: "Nairobi - Kilimani",
          status: "active",
        }),
        expect.objectContaining({
          id: "guest:guest@example.com",
          name: "Guest Buyer",
          orders: 1,
          spend: 800,
          status: "new",
        }),
      ]),
    );
    expect(result.summary).toEqual({
      total: 2,
      newThisMonth: 1,
      returningRate: 0,
      averageLifetimeSpend: 1000,
    });
  });

  it("pages through WooCommerce instead of silently truncating the directory", async () => {
    mockedFetchWoo
      .mockResolvedValueOnce(
        Array.from({ length: 100 }, (_, id) => ({
          id: id + 1,
          email: `c${id}@test.com`,
          first_name: "C",
          last_name: String(id),
          date_created: "2025-01-01",
          billing: {},
        })),
      )
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await fetchAdminCustomers(new Date("2026-07-16"));

    expect(mockedFetchWoo).toHaveBeenCalledWith(
      "customers?per_page=100&page=1",
      { noCache: true },
    );
    expect(mockedFetchWoo).toHaveBeenCalledWith(
      "customers?per_page=100&page=2",
      { noCache: true },
    );
    expect(mockedFetchWoo).toHaveBeenCalledWith(
      "orders?per_page=100&page=1&status=any",
      { noCache: true },
    );
    expect(result.summary.total).toBe(100);
  });
});
