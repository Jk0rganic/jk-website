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

describe("GET /api/admin/analytics/products", () => {
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
      error: "Unauthorized",
      status: 401,
      session: null,
    });

    const response = await GET(
      new Request("http://test.local/api/admin/analytics/products"),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
    expect(mockedFetchAdminOrders).not.toHaveBeenCalled();
  });

  it("passes date filters to fetchAdminOrders", async () => {
    mockedFetchAdminOrders.mockResolvedValue([]);

    await GET(
      new Request(
        "http://test.local/api/admin/analytics/products?preset=custom&after=2026-06-01T00:00:00.000Z&before=2026-06-30T23:59:59.999Z",
      ),
    );

    expect(mockedFetchAdminOrders).toHaveBeenCalledWith({
      after: "2026-06-01T00:00:00.000Z",
      before: "2026-06-30T23:59:59.999Z",
    });
  });

  it("returns mapped product report JSON", async () => {
    mockedFetchAdminOrders.mockResolvedValue([
      orderFixture({
        line_items: [
          { product_id: 10, name: "Rosehip Oil", quantity: 2, total: "90" },
          { product_id: 11, name: "Body Lotion", quantity: 1, total: "35" },
        ],
      }),
      orderFixture({
        line_items: [
          { product_id: 10, name: "Rosehip Oil", quantity: 1, total: "45" },
        ],
      }),
    ]);

    const response = await GET(
      new Request("http://test.local/api/admin/analytics/products"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      dateRange: expect.objectContaining({
        preset: "last_7_days",
      }),
      products: {
        topProducts: [
          {
            productId: 10,
            name: "Rosehip Oil",
            unitsSold: 3,
            revenue: 135,
          },
          {
            productId: 11,
            name: "Body Lotion",
            unitsSold: 1,
            revenue: 35,
          },
        ],
        productsWithNoSales: [],
      },
    });
  });

  it("returns a stable 500 response when order fetching fails", async () => {
    mockedFetchAdminOrders.mockRejectedValue(new Error("Woo private detail"));

    const response = await GET(
      new Request("http://test.local/api/admin/analytics/products"),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to fetch product analytics",
    });
    expect(console.error).toHaveBeenCalledWith(
      "[ADMIN_ANALYTICS_PRODUCTS_ERROR]",
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
