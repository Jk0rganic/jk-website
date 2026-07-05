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

describe("GET /api/admin/analytics/discounts", () => {
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
      new Request("http://test.local/api/admin/analytics/discounts"),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Forbidden" });
    expect(mockedFetchAdminOrders).not.toHaveBeenCalled();
  });

  it("passes date filters to fetchAdminOrders", async () => {
    mockedFetchAdminOrders.mockResolvedValue([]);

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
    mockedFetchAdminOrders.mockResolvedValue([
      orderFixture({
        coupon_lines: [{ code: " save10 ", discount: "25" }],
        discount_total: "25",
      }),
      orderFixture({
        coupon_lines: [{ code: "SAVE10", discount: "15" }],
        discount_total: "15",
      }),
      orderFixture({
        coupon_lines: [{ code: "WELCOME", discount: "5" }],
        discount_total: "5",
      }),
    ]);

    const response = await GET(
      new Request("http://test.local/api/admin/analytics/discounts"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      dateRange: expect.objectContaining({
        preset: "last_7_days",
      }),
      discounts: {
        totalDiscounts: 45,
        discountedOrders: 3,
        couponCount: 3,
        coupons: [
          { code: "SAVE10", orders: 2, discount: 40 },
          { code: "WELCOME", orders: 1, discount: 5 },
        ],
      },
    });
  });

  it("returns a stable 500 response when order fetching fails", async () => {
    mockedFetchAdminOrders.mockRejectedValue(new Error("Woo private detail"));

    const response = await GET(
      new Request("http://test.local/api/admin/analytics/discounts"),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to fetch discount analytics",
    });
    expect(console.error).toHaveBeenCalledWith(
      "[ADMIN_ANALYTICS_DISCOUNTS_ERROR]",
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
