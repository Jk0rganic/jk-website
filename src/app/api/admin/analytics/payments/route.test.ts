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
    summarizePayments: vi.fn(actual.summarizePayments),
  };
});

import { summarizePayments } from "@/lib/admin/analytics-service";
import { fetchAdminOrders } from "@/lib/admin/fetch-admin-orders";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { GET } from "./route";

const mockedRequireAdminSession = vi.mocked(requireAdminSession);
const mockedFetchAdminOrders = vi.mocked(fetchAdminOrders);
const mockedSummarizePayments = vi.mocked(summarizePayments);
const adminSession = {
  user: { id: "admin-1", email: "admin@jk.test", role: "min_admin" },
} as never;

const orders = [
  {
    id: 1,
    status: "processing",
    total: "1300",
    line_items: [],
    shipping_lines: [],
    payment_method: "cod",
    payment_method_title: "Cash on Delivery",
    needs_payment: false,
  },
  {
    id: 2,
    status: "completed",
    total: "2100",
    line_items: [],
    shipping_lines: [],
    payment_method: "intasend",
    payment_method_title: "M-Pesa via IntaSend",
    needs_payment: false,
  },
  {
    id: 3,
    status: "pending",
    total: "900",
    line_items: [],
    shipping_lines: [],
    payment_method: "mpesa",
    payment_method_title: "M-Pesa",
    needs_payment: true,
  },
] as unknown as DashboardOrder[];

describe("GET /api/admin/analytics/payments", () => {
  beforeEach(() => {
    mockedRequireAdminSession.mockReset();
    mockedFetchAdminOrders.mockReset();
    mockedSummarizePayments.mockReset();
    vi.restoreAllMocks();
    mockedSummarizePayments.mockReturnValue({
      cashTotal: 1300,
      mpesaIntasendTotal: 2100,
      otherTotal: 0,
      cashOrders: 1,
      mpesaIntasendOrders: 2,
      otherOrders: 0,
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
      new Request("http://test.local/api/admin/analytics/payments"),
    );

    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ error });
    expect(mockedFetchAdminOrders).not.toHaveBeenCalled();
  });

  it("passes date filters to fetchAdminOrders", async () => {
    await GET(
      new Request(
        "http://test.local/api/admin/analytics/payments?preset=custom&after=2026-06-01T00:00:00.000Z&before=2026-06-30T23:59:59.999Z",
      ),
    );

    expect(mockedFetchAdminOrders).toHaveBeenCalledWith({
      after: "2026-06-01T00:00:00.000Z",
      before: "2026-06-30T23:59:59.999Z",
    });
  });

  it("returns mapped payment report JSON", async () => {
    const response = await GET(
      new Request(
        "http://test.local/api/admin/analytics/payments?preset=custom&after=2026-06-01T00:00:00.000Z&before=2026-06-30T23:59:59.999Z",
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
        cashTotal: 1300,
        mpesaIntasendTotal: 2100,
        otherTotal: 0,
        cashOrders: 1,
        mpesaIntasendOrders: 2,
        otherOrders: 0,
      },
      rows: [
        {
          method: "M-Pesa",
          paidTotal: 2100,
          orderCount: 2,
          pendingCount: 1,
          failedCount: 0,
          pendingRate: 50,
        },
        {
          method: "Cash",
          paidTotal: 1300,
          orderCount: 1,
          pendingCount: 0,
          failedCount: 0,
          pendingRate: 0,
        },
      ],
    });
  });

  it("returns stable 500 JSON on upstream failures", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockedFetchAdminOrders.mockRejectedValue(new Error("Woo secret failure"));

    const response = await GET(
      new Request("http://test.local/api/admin/analytics/payments"),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to load analytics",
    });
    expect(errorSpy).toHaveBeenCalled();
  });

  it("returns stable 500 JSON on report mapping failures", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockedSummarizePayments.mockImplementation(() => {
      throw new Error("private payment aggregation detail");
    });

    const response = await GET(
      new Request("http://test.local/api/admin/analytics/payments"),
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
