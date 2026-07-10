import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/admin/require-admin", () => ({
  requireAdminSession: vi.fn(),
}));

vi.mock("@/lib/admin/fetch-admin-orders", () => ({
  fetchAdminOrders: vi.fn(),
}));

import { fetchAdminOrders } from "@/lib/admin/fetch-admin-orders";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { GET } from "./route";

const mockedRequireAdminSession = vi.mocked(requireAdminSession);
const mockedFetchAdminOrders = vi.mocked(fetchAdminOrders);
const adminSession = {
  user: { id: "admin-1", email: "admin@jk.test", role: "min_admin" },
} as never;

const orders = [
  {
    id: 1,
    status: "processing",
    total: "1300",
    line_items: [
      {
        product_id: 10,
        name: "Aloe Balm",
        quantity: 2,
        subtotal: "1200",
        total: "1000",
      },
    ],
    shipping_lines: [{ method_title: "Door Delivery", total: "300" }],
    payment_method: "cod",
    payment_method_title: "Cash on Delivery",
    needs_payment: false,
    meta_data: [
      { key: "_county", value: "Nairobi" },
      { key: "_delivery_type", value: "door_to_door" },
    ],
    coupon_lines: [{ code: "WELCOME", discount: "200" }],
  },
] as unknown as DashboardOrder[];

describe("GET /api/admin/analytics/overview", () => {
  beforeEach(() => {
    mockedRequireAdminSession.mockReset();
    mockedFetchAdminOrders.mockReset();
    vi.restoreAllMocks();
    mockedRequireAdminSession.mockResolvedValue({
      error: null,
      status: 200,
      session: adminSession,
    });
    mockedFetchAdminOrders.mockResolvedValue(orders);
  });

  it.each([
    ["Unauthorized", 401],
    ["Forbidden", 403],
  ] as const)("rejects %s users", async (error, status) => {
    mockedRequireAdminSession.mockResolvedValue({
      error,
      status,
      session: null,
    });

    const response = await GET(
      new Request("http://test.local/api/admin/analytics/overview"),
    );

    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ error });
    expect(mockedFetchAdminOrders).not.toHaveBeenCalled();
  });

  it("passes date filters to fetchAdminOrders", async () => {
    await GET(
      new Request(
        "http://test.local/api/admin/analytics/overview?preset=custom&after=2026-06-01T00:00:00.000Z&before=2026-06-30T23:59:59.999Z",
      ),
    );

    expect(mockedFetchAdminOrders).toHaveBeenCalledWith({
      after: "2026-06-01T00:00:00.000Z",
      before: "2026-06-30T23:59:59.999Z",
    });
  });

  it("returns mapped overview JSON with comparison when requested", async () => {
    mockedFetchAdminOrders.mockResolvedValueOnce(orders).mockResolvedValueOnce([
      {
        ...orders[0],
        id: 2,
        total: "500",
        line_items: [
          {
            product_id: 11,
            name: "Neem Soap",
            quantity: 1,
            subtotal: "500",
            total: "500",
          },
        ],
        coupon_lines: [],
      },
    ] as unknown as DashboardOrder[]);

    const response = await GET(
      new Request(
        "http://test.local/api/admin/analytics/overview?preset=custom&after=2026-06-08T00:00:00.000Z&before=2026-06-14T23:59:59.999Z&compare=true",
      ),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      dateRange: {
        preset: "custom",
        after: "2026-06-08T00:00:00.000Z",
        before: "2026-06-14T23:59:59.999Z",
      },
      comparisonRange: {
        preset: "comparison",
        after: "2026-06-01T00:00:00.000Z",
        before: "2026-06-07T23:59:59.999Z",
      },
      overview: {
        revenue: {
          totalOrderRevenue: 1300,
          totalDeliveryFees: 300,
          unitsSold: 2,
          orderCount: 1,
        },
        payments: { cashTotal: 1300, cashOrders: 1 },
        products: {
          topProducts: [
            { productId: 10, name: "Aloe Balm", unitsSold: 2, revenue: 1000 },
          ],
        },
        locations: {
          topLocations: [{ location: "Nairobi", orders: 1, revenue: 1300 }],
        },
        discounts: {
          totalDiscounts: 200,
          coupons: [{ code: "WELCOME", orders: 1, discount: 200 }],
        },
      },
      comparisonOverview: {
        revenue: { totalOrderRevenue: 500, unitsSold: 1, orderCount: 1 },
      },
    });
  });

  it("returns stable 500 JSON on upstream failures", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockedFetchAdminOrders.mockRejectedValue(new Error("Woo secret failure"));

    const response = await GET(
      new Request("http://test.local/api/admin/analytics/overview"),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to load analytics",
    });
    expect(errorSpy).toHaveBeenCalled();
  });
});
