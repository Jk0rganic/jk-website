import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/admin/require-admin", () => ({
  requireAdminSession: vi.fn(),
}));

vi.mock("@/lib/admin/fetch-admin-orders", () => ({
  fetchAdminOrders: vi.fn(),
}));

import { fetchAdminOrders } from "@/lib/admin/fetch-admin-orders";
import { requireAdminSession } from "@/lib/admin/require-admin";
import type { Session } from "@/lib/auth/getSession";
import { GET } from "./route";

const mockedRequireAdminSession = vi.mocked(requireAdminSession);
const mockedFetchAdminOrders = vi.mocked(fetchAdminOrders);

const adminSession: Session = {
  user: {
    id: "admin-1",
    email: "admin@jkorganics.com",
    role: "min_admin",
  },
};

describe("GET /api/admin/analytics/overview", () => {
  beforeEach(() => {
    mockedRequireAdminSession.mockReset();
    mockedFetchAdminOrders.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockedRequireAdminSession.mockResolvedValue({
      error: null,
      status: 200,
      session: adminSession,
    });
  });

  it("rejects unauthenticated or forbidden users via the admin guard", async () => {
    mockedRequireAdminSession.mockResolvedValue({
      error: "Forbidden",
      status: 403,
      session: null,
    });

    const response = await GET(
      new Request("http://test.local/api/admin/analytics/overview"),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Forbidden" });
    expect(mockedFetchAdminOrders).not.toHaveBeenCalled();
  });

  it("passes date filters to fetchAdminOrders", async () => {
    mockedFetchAdminOrders.mockResolvedValue([]);

    const response = await GET(
      new Request(
        "http://test.local/api/admin/analytics/overview?preset=custom&after=2026-06-01T00:00:00.000Z&before=2026-06-30T23:59:59.999Z",
      ),
    );

    expect(response.status).toBe(200);
    expect(mockedFetchAdminOrders).toHaveBeenCalledWith({
      after: "2026-06-01T00:00:00.000Z",
      before: "2026-06-30T23:59:59.999Z",
    });
  });

  it("returns mapped overview JSON with comparison data when requested", async () => {
    mockedFetchAdminOrders
      .mockResolvedValueOnce([
        orderFixture({
          id: 10,
          total: "120",
          payment_method: "cod",
          payment_method_title: "Cash on delivery",
          line_items: [
            { product_id: 1, name: "Rosehip Oil", quantity: 2, total: "80" },
          ],
          shipping_lines: [{ total: "20", method_title: "Door delivery" }],
          billing: { state: "Nairobi County" },
        }),
      ])
      .mockResolvedValueOnce([
        orderFixture({
          id: 9,
          total: "60",
          line_items: [
            { product_id: 2, name: "Body Lotion", quantity: 1, total: "50" },
          ],
        }),
      ]);

    const response = await GET(
      new Request(
        "http://test.local/api/admin/analytics/overview?preset=custom&after=2026-06-01T00:00:00.000Z&before=2026-06-07T23:59:59.999Z&compare=true",
      ),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      dateRange: {
        preset: "custom",
        after: "2026-06-01T00:00:00.000Z",
        before: "2026-06-07T23:59:59.999Z",
      },
      comparisonRange: {
        preset: "comparison",
        after: "2026-05-25T00:00:00.000Z",
        before: "2026-05-31T23:59:59.999Z",
      },
      overview: expect.objectContaining({
        revenue: expect.objectContaining({
          totalOrderRevenue: 120,
          unitsSold: 2,
          orderCount: 1,
        }),
        payments: expect.objectContaining({
          cashTotal: 120,
          cashOrders: 1,
        }),
        products: expect.objectContaining({
          topProducts: [
            {
              productId: 1,
              name: "Rosehip Oil",
              unitsSold: 2,
              revenue: 80,
            },
          ],
        }),
      }),
      comparisonOverview: expect.objectContaining({
        revenue: expect.objectContaining({
          totalOrderRevenue: 60,
          orderCount: 1,
        }),
      }),
    });
  });

  it("returns a stable 500 response when order fetching fails", async () => {
    mockedFetchAdminOrders.mockRejectedValue(new Error("Woo private detail"));

    const response = await GET(
      new Request("http://test.local/api/admin/analytics/overview"),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to fetch analytics overview",
    });
    expect(console.error).toHaveBeenCalledWith(
      "[ADMIN_ANALYTICS_OVERVIEW_ERROR]",
      expect.any(Error),
    );
  });
});

function orderFixture(overrides: Partial<DashboardOrder> = {}): DashboardOrder {
  return {
    id: 1,
    status: "processing",
    total: "0",
    needs_payment: false,
    payment_method: "intasend",
    payment_method_title: "IntaSend M-Pesa",
    line_items: [],
    shipping_lines: [],
    meta_data: [],
    billing: {},
    shipping: {},
    ...overrides,
  } as DashboardOrder;
}
