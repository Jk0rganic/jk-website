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
    summarizeDiscounts: vi.fn(actual.summarizeDiscounts),
  };
});

import { summarizeDiscounts } from "@/lib/admin/analytics-service";
import { fetchAdminOrders } from "@/lib/admin/fetch-admin-orders";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { GET } from "./route";

const mockedRequireAdminSession = vi.mocked(requireAdminSession);
const mockedFetchAdminOrders = vi.mocked(fetchAdminOrders);
const mockedSummarizeDiscounts = vi.mocked(summarizeDiscounts);
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
    shipping_lines: [],
    payment_method: "cod",
    payment_method_title: "Cash on Delivery",
    needs_payment: false,
    discount_total: "200",
    coupon_lines: [{ code: "welcome", discount: "200" }],
  },
  {
    id: 2,
    status: "processing",
    total: "900",
    line_items: [],
    shipping_lines: [],
    payment_method: "cod",
    payment_method_title: "Cash on Delivery",
    needs_payment: false,
  },
] as unknown as DashboardOrder[];

describe("GET /api/admin/analytics/discounts", () => {
  beforeEach(() => {
    mockedRequireAdminSession.mockReset();
    mockedFetchAdminOrders.mockReset();
    mockedSummarizeDiscounts.mockReset();
    vi.restoreAllMocks();
    mockedSummarizeDiscounts.mockReturnValue({
      totalDiscounts: 200,
      discountedOrders: 1,
      couponCount: 1,
      coupons: [{ code: "WELCOME", orders: 1, discount: 200 }],
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
      new Request("http://test.local/api/admin/analytics/discounts"),
    );

    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ error });
    expect(mockedFetchAdminOrders).not.toHaveBeenCalled();
  });

  it("passes date filters to fetchAdminOrders", async () => {
    await GET(
      new Request(
        "http://test.local/api/admin/analytics/discounts?preset=custom&after=2026-06-01T00:00:00.000Z&before=2026-06-30T23:59:59.999Z",
      ),
    );

    expect(mockedFetchAdminOrders).toHaveBeenCalledWith({
      after: "2026-06-01T00:00:00.000Z",
      before: "2026-06-30T23:59:59.999Z",
    });
  });

  it("returns mapped discount report JSON", async () => {
    const response = await GET(
      new Request(
        "http://test.local/api/admin/analytics/discounts?preset=custom&after=2026-06-01T00:00:00.000Z&before=2026-06-30T23:59:59.999Z",
      ),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      dateRange: {
        preset: "custom",
        after: "2026-06-01T00:00:00.000Z",
        before: "2026-06-30T23:59:59.999Z",
      },
      summary: {
        totalDiscounts: 200,
        discountedOrders: 1,
        couponCount: 1,
      },
      rows: [{ code: "WELCOME", orders: 1, discount: 200 }],
    });
  });

  it("returns stable 500 JSON on upstream failures", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockedFetchAdminOrders.mockRejectedValue(new Error("Woo secret failure"));

    const response = await GET(
      new Request("http://test.local/api/admin/analytics/discounts"),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to load analytics",
    });
    expect(errorSpy).toHaveBeenCalled();
  });

  it("returns stable 500 JSON on report mapping failures", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockedSummarizeDiscounts.mockImplementation(() => {
      throw new Error("private discount aggregation detail");
    });

    const response = await GET(
      new Request("http://test.local/api/admin/analytics/discounts"),
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
