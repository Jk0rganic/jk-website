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

describe("GET /api/admin/analytics/locations", () => {
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
      new Request("http://test.local/api/admin/analytics/locations"),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Forbidden" });
    expect(mockedFetchAdminOrders).not.toHaveBeenCalled();
  });

  it("passes date filters to fetchAdminOrders", async () => {
    mockedFetchAdminOrders.mockResolvedValue([]);

    await GET(
      new Request(
        "http://test.local/api/admin/analytics/locations?preset=custom&after=2026-06-01T00:00:00.000Z&before=2026-06-30T23:59:59.999Z",
      ),
    );

    expect(mockedFetchAdminOrders).toHaveBeenCalledWith({
      after: "2026-06-01T00:00:00.000Z",
      before: "2026-06-30T23:59:59.999Z",
    });
  });

  it("returns mapped location report JSON", async () => {
    mockedFetchAdminOrders.mockResolvedValue([
      orderFixture({
        total: "100",
        billing: { state: "Nairobi County" },
        shipping_lines: [{ total: "10", method_title: "Door delivery" }],
      }),
      orderFixture({
        total: "75",
        billing: { state: "Nairobi County" },
        shipping_lines: [{ total: "0", method_title: "Store pickup" }],
      }),
      orderFixture({
        total: "50",
        billing: { city: "Kisumu" },
        shipping_lines: [{ total: "5", method_title: "Parcel office" }],
      }),
    ]);

    const response = await GET(
      new Request("http://test.local/api/admin/analytics/locations"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      dateRange: expect.objectContaining({
        preset: "last_7_days",
      }),
      locations: {
        topLocations: [
          { location: "Nairobi", orders: 2, revenue: 175 },
          { location: "Kisumu", orders: 1, revenue: 50 },
        ],
        deliveryTypeSplit: [
          { type: "door_to_door", orders: 1, revenue: 100 },
          { type: "pickup", orders: 1, revenue: 75 },
          { type: "parcel_office", orders: 1, revenue: 50 },
        ],
      },
    });
  });

  it("returns a stable 500 response when order fetching fails", async () => {
    mockedFetchAdminOrders.mockRejectedValue(new Error("Woo private detail"));

    const response = await GET(
      new Request("http://test.local/api/admin/analytics/locations"),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to fetch location analytics",
    });
    expect(console.error).toHaveBeenCalledWith(
      "[ADMIN_ANALYTICS_LOCATIONS_ERROR]",
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
