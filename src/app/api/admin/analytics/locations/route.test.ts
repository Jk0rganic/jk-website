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
    summarizeLocations: vi.fn(actual.summarizeLocations),
  };
});

import { summarizeLocations } from "@/lib/admin/analytics-service";
import { fetchAdminOrders } from "@/lib/admin/fetch-admin-orders";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { GET } from "./route";

const mockedRequireAdminSession = vi.mocked(requireAdminSession);
const mockedFetchAdminOrders = vi.mocked(fetchAdminOrders);
const mockedSummarizeLocations = vi.mocked(summarizeLocations);
const adminSession = {
  user: { id: "admin-1", email: "admin@jk.test", role: "min_admin" },
} as never;

const orders = [
  {
    id: 1,
    status: "processing",
    total: "1300",
    line_items: [],
    shipping_lines: [{ method_title: "Door Delivery", total: "300" }],
    payment_method: "cod",
    payment_method_title: "Cash on Delivery",
    needs_payment: false,
    meta_data: [
      { key: "_county", value: "Nairobi County" },
      { key: "_delivery_type", value: "door_to_door" },
    ],
    billing: { state: "Nairobi", city: "Nairobi" },
    shipping: { state: "Nairobi", city: "Nairobi" },
  },
  {
    id: 2,
    status: "processing",
    total: "900",
    line_items: [],
    shipping_lines: [{ method_title: "Parcel Office", total: "100" }],
    payment_method: "mpesa",
    payment_method_title: "M-Pesa",
    needs_payment: false,
    meta_data: [
      { key: "_county", value: "Kisumu" },
      { key: "_delivery_type", value: "parcel_office" },
    ],
    billing: { state: "Kisumu", city: "Kisumu" },
    shipping: { state: "Kisumu", city: "Kisumu" },
  },
] as unknown as DashboardOrder[];

describe("GET /api/admin/analytics/locations", () => {
  beforeEach(() => {
    mockedRequireAdminSession.mockReset();
    mockedFetchAdminOrders.mockReset();
    mockedSummarizeLocations.mockReset();
    vi.restoreAllMocks();
    mockedSummarizeLocations.mockReturnValue({
      topLocations: [
        { location: "Nairobi", orders: 1, revenue: 1300 },
        { location: "Kisumu", orders: 1, revenue: 900 },
      ],
      deliveryTypeSplit: [
        { type: "door_to_door", orders: 1, revenue: 1300 },
        { type: "parcel_office", orders: 1, revenue: 900 },
      ],
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
      new Request("http://test.local/api/admin/analytics/locations"),
    );

    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ error });
    expect(mockedFetchAdminOrders).not.toHaveBeenCalled();
  });

  it("passes date filters to fetchAdminOrders", async () => {
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
    const response = await GET(
      new Request(
        "http://test.local/api/admin/analytics/locations?preset=custom&after=2026-06-01T00:00:00.000Z&before=2026-06-30T23:59:59.999Z",
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
        {
          location: "Nairobi",
          orders: 1,
          revenue: 1300,
          deliveryFees: 300,
          topDeliveryType: "door_to_door",
          orderShare: 50,
        },
        {
          location: "Kisumu",
          orders: 1,
          revenue: 900,
          deliveryFees: 100,
          topDeliveryType: "parcel_office",
          orderShare: 50,
        },
      ],
      deliveryTypeSplit: [
        { type: "door_to_door", orders: 1, revenue: 1300 },
        { type: "parcel_office", orders: 1, revenue: 900 },
      ],
    });
  });

  it("returns stable 500 JSON on upstream failures", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockedFetchAdminOrders.mockRejectedValue(new Error("Woo secret failure"));

    const response = await GET(
      new Request("http://test.local/api/admin/analytics/locations"),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to load analytics",
    });
    expect(errorSpy).toHaveBeenCalled();
  });

  it("returns stable 500 JSON on report mapping failures", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockedSummarizeLocations.mockImplementation(() => {
      throw new Error("private location aggregation detail");
    });

    const response = await GET(
      new Request("http://test.local/api/admin/analytics/locations"),
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
