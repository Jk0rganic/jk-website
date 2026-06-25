import { describe, expect, it } from "vitest";
import {
  computeMonthlyChartData,
  computeWeeklyComparison,
  computeYearOverYearGrowth,
  filterOrders,
  getOrderYears,
} from "./admin-stats";

const sampleOrders: DashboardOrder[] = [
  {
    id: 1,
    status: "processing",
    date_created: "2026-06-20T10:00:00",
    total: "1500",
    currency: "KES",
    billing: {
      first_name: "Jane",
      last_name: "Doe",
      email: "jane@example.com",
      phone: "0712345678",
      address_1: "Nairobi",
      city: "Nairobi",
      postcode: "00100",
      country: "KE",
    },
    shipping: {
      first_name: "Jane",
      last_name: "Doe",
      address_1: "Nairobi",
      city: "Nairobi",
      postcode: "00100",
      phone: "0712345678",
      country: "KE",
    },
    line_items: [{ quantity: 2 } as LineItem],
    shipping_lines: [],
    payment_method: "intasend",
    payment_method_title: "Online Payment",
    date_paid: "2026-06-20T10:05:00",
    needs_payment: false,
  },
  {
    id: 2,
    status: "pending",
    date_created: "2025-03-10T10:00:00",
    total: "800",
    currency: "KES",
    billing: {
      first_name: "John",
      last_name: "Smith",
      email: "john@example.com",
      phone: "0799999999",
      address_1: "Mombasa",
      city: "Mombasa",
      postcode: "80100",
      country: "KE",
    },
    shipping: {
      first_name: "John",
      last_name: "Smith",
      address_1: "Mombasa",
      city: "Mombasa",
      postcode: "80100",
      phone: "0799999999",
      country: "KE",
    },
    line_items: [{ quantity: 1 } as LineItem],
    shipping_lines: [],
    payment_method: "cod",
    payment_method_title: "Cash on Delivery",
    date_paid: null,
    needs_payment: false,
  },
];

describe("computeWeeklyComparison", () => {
  it("aggregates sales, orders, and product quantities", () => {
    const now = new Date("2026-06-24T12:00:00");
    const result = computeWeeklyComparison(sampleOrders, now);

    expect(result.thisWeek.orders).toBe(1);
    expect(result.thisWeek.sales).toBe(1500);
    expect(result.thisWeek.products).toBe(2);
    expect(result.lastWeek.orders).toBe(0);
  });
});

describe("computeMonthlyChartData", () => {
  it("groups revenue and order counts by month", () => {
    const data = computeMonthlyChartData(sampleOrders, 2026);
    const june = data.find((point) => point.month === "Jun");

    expect(june?.revenue).toBe(1500);
    expect(june?.orders).toBe(1);
  });
});

describe("computeYearOverYearGrowth", () => {
  it("calculates growth against the previous year", () => {
    const result = computeYearOverYearGrowth(sampleOrders, 2026);

    expect(result.currentYearTotal).toBe(1500);
    expect(result.isUp).toBe(true);
    expect(result.percentage).toBe(87.5);
  });
});

describe("getOrderYears", () => {
  it("returns unique years sorted descending", () => {
    expect(getOrderYears(sampleOrders, 2026)).toEqual([2026, 2025]);
  });
});

describe("filterOrders", () => {
  it("filters by status, payment method, and search", () => {
    const byStatus = filterOrders(sampleOrders, { status: "pending" });
    expect(byStatus).toHaveLength(1);
    expect(byStatus[0].id).toBe(2);

    const byPayment = filterOrders(sampleOrders, { paymentMethod: "intasend" });
    expect(byPayment).toHaveLength(1);
    expect(byPayment[0].id).toBe(1);

    const bySearch = filterOrders(sampleOrders, { search: "jane@" });
    expect(bySearch).toHaveLength(1);
    expect(bySearch[0].billing.email).toBe("jane@example.com");
  });
});
