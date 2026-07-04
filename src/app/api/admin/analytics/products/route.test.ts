import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/admin/require-admin", () => ({
  requireAdminSession: vi.fn(),
}));

vi.mock("@/lib/admin/fetch-admin-orders", () => ({
  fetchAdminOrders: vi.fn(),
}));

vi.mock("@/lib/admin/analytics-service", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/admin/analytics-service")
  >("@/lib/admin/analytics-service");

  return {
    ...actual,
    summarizeProducts: vi.fn(actual.summarizeProducts),
  };
});

import { summarizeProducts } from "@/lib/admin/analytics-service";
import { fetchAdminOrders } from "@/lib/admin/fetch-admin-orders";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { GET } from "./route";

const mockedRequireAdminSession = vi.mocked(requireAdminSession);
const mockedFetchAdminOrders = vi.mocked(fetchAdminOrders);
const mockedSummarizeProducts = vi.mocked(summarizeProducts);
const adminSession = {
  user: { id: "admin-1", email: "admin@jk.test", role: "min_admin" },
} as never;

const orders = [
  {
    id: 1,
    status: "processing",
    total: "1500",
    line_items: [
      {
        product_id: 10,
        name: "Aloe Balm",
        quantity: 2,
        subtotal: "1200",
        total: "1000",
      },
      {
        product_id: 11,
        name: "Neem Soap",
        quantity: 1,
        subtotal: "500",
        total: "500",
      },
    ],
    shipping_lines: [],
    payment_method: "cod",
    payment_method_title: "Cash on Delivery",
    needs_payment: false,
    meta_data: [],
  },
] as unknown as DashboardOrder[];

describe("GET /api/admin/analytics/products", () => {
  beforeEach(() => {
    mockedRequireAdminSession.mockReset();
    mockedFetchAdminOrders.mockReset();
    mockedSummarizeProducts.mockReset();
    vi.restoreAllMocks();
    mockedSummarizeProducts.mockImplementation((orders, catalog) => {
      const products = new Map<
        number,
        { productId: number; name: string; unitsSold: number; revenue: number }
      >();

      for (const order of orders) {
        for (const item of order.line_items ?? []) {
          const current = products.get(item.product_id) ?? {
            productId: item.product_id,
            name: item.name,
            unitsSold: 0,
            revenue: 0,
          };
          current.unitsSold += item.quantity || 0;
          current.revenue += Number(item.total || 0);
          products.set(item.product_id, current);
        }
      }

      return {
        topProducts: Array.from(products.values()).sort(
          (a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue,
        ),
        productsWithNoSales: (catalog ?? []).filter(
          (product) => !products.has(product.id),
        ),
      };
    });
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
      new Request("http://test.local/api/admin/analytics/products"),
    );

    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ error });
    expect(mockedFetchAdminOrders).not.toHaveBeenCalled();
  });

  it("passes date filters to fetchAdminOrders", async () => {
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
    const response = await GET(
      new Request(
        "http://test.local/api/admin/analytics/products?preset=custom&after=2026-06-01T00:00:00.000Z&before=2026-06-30T23:59:59.999Z",
      ),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      dateRange: {
        preset: "custom",
        after: "2026-06-01T00:00:00.000Z",
        before: "2026-06-30T23:59:59.999Z",
      },
      rows: [
        { productId: 10, name: "Aloe Balm", unitsSold: 2, revenue: 1000 },
        { productId: 11, name: "Neem Soap", unitsSold: 1, revenue: 500 },
      ],
      productsWithNoSales: [],
    });
  });

  it("returns stable 500 JSON on upstream failures", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockedFetchAdminOrders.mockRejectedValue(new Error("Woo secret failure"));

    const response = await GET(
      new Request("http://test.local/api/admin/analytics/products"),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to load analytics",
    });
    expect(errorSpy).toHaveBeenCalled();
  });

  it("returns stable 500 JSON on report mapping failures", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockedSummarizeProducts.mockImplementation(() => {
      throw new Error("private product aggregation detail");
    });

    const response = await GET(
      new Request("http://test.local/api/admin/analytics/products"),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to load analytics",
    });
    expect(errorSpy).toHaveBeenCalledWith(
      "Failed to load admin analytics",
      expect.any(Error),
    );
  });
});
