import { describe, expect, it } from "vitest";
import {
  computeMonthlyChartData,
  computeOrderStatusSummary,
  computePaymentMethodSummary,
  computeTopCustomers,
  computeTopLocations,
  computeTopProducts,
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
    meta_data: [],
    customer_note: "",
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
    meta_data: [],
    customer_note: "",
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

describe("computeOrderStatusSummary", () => {
  it("counts known order statuses and groups unknown statuses as other", () => {
    const result = computeOrderStatusSummary([
      ...sampleOrders,
      { ...sampleOrders[0], id: 3, status: "on-hold" },
      { ...sampleOrders[0], id: 4, status: "completed" },
      { ...sampleOrders[0], id: 5, status: "cancelled" },
      { ...sampleOrders[0], id: 6, status: "refunded" },
      { ...sampleOrders[0], id: 7, status: "failed" },
      { ...sampleOrders[0], id: 8, status: "draft" },
    ]);

    expect(result).toEqual({
      pending: 1,
      onHold: 1,
      processing: 1,
      completed: 1,
      cancelled: 1,
      refunded: 1,
      failed: 1,
      other: 1,
    });
  });
});

describe("computePaymentMethodSummary", () => {
  it("counts cash on delivery, IntaSend, and other payment methods", () => {
    const result = computePaymentMethodSummary([
      ...sampleOrders,
      { ...sampleOrders[0], id: 3, payment_method: "intasend_mpesa" },
      { ...sampleOrders[0], id: 4, payment_method: "stripe" },
    ]);

    expect(result).toEqual({
      cod: 1,
      intasend: 2,
      other: 1,
    });
  });
});

describe("computeTopProducts", () => {
  it("sorts products by quantity and then revenue while tolerating missing line items", () => {
    const result = computeTopProducts(
      [
        {
          ...sampleOrders[0],
          line_items: [
            { name: "Aloe Balm", quantity: 2, total: "600" } as LineItem,
            { name: "Moringa Oil", quantity: 4, total: "800" } as LineItem,
          ],
        },
        {
          ...sampleOrders[0],
          id: 3,
          line_items: [
            { name: "Aloe Balm", quantity: 2, total: "700" } as LineItem,
            { name: "Shea Cream", quantity: 4, total: "900" } as LineItem,
          ],
        },
        { ...sampleOrders[0], id: 4, line_items: undefined },
      ],
      2,
    );

    expect(result).toEqual([
      { name: "Aloe Balm", quantity: 4, revenue: 1300 },
      { name: "Shea Cream", quantity: 4, revenue: 900 },
    ]);
  });

  it("keeps the first available product image for top product summaries", () => {
    const result = computeTopProducts(
      [
        {
          ...sampleOrders[0],
          line_items: [
            {
              name: "Moringa Oil",
              quantity: 1,
              total: "800",
              image: {
                src: "https://myshop.jkorganics.co.ke/wp-content/uploads/moringa.jpg",
                alt: "Moringa oil bottle",
              },
            } as LineItem & {
              image: { src: string; alt: string };
            },
          ],
        },
      ],
      1,
    );

    expect(result).toEqual([
      {
        name: "Moringa Oil",
        quantity: 1,
        revenue: 800,
        image: {
          src: "https://myshop.jkorganics.co.ke/wp-content/uploads/moringa.jpg",
          alt: "Moringa oil bottle",
        },
      },
    ]);
  });
});

describe("computeTopLocations", () => {
  it("groups orders by county/city and sorts by order count", () => {
    const result = computeTopLocations(
      [sampleOrders[0], { ...sampleOrders[0], id: 3 }, sampleOrders[1]],
      2,
    );

    expect(result).toEqual([
      { location: "Nairobi", orders: 2, revenue: 3000 },
      { location: "Mombasa", orders: 1, revenue: 800 },
    ]);
  });

  it("falls back to Unknown when no state or city is present", () => {
    const result = computeTopLocations([{ total: "500", billing: {} }], 5);

    expect(result).toEqual([{ location: "Unknown", orders: 1, revenue: 500 }]);
  });
});

describe("computeTopCustomers", () => {
  it("groups orders by customer email and sorts by revenue", () => {
    const result = computeTopCustomers(
      [
        sampleOrders[0],
        { ...sampleOrders[0], id: 3, total: "500" },
        sampleOrders[1],
      ],
      2,
    );

    expect(result).toEqual([
      {
        key: "jane@example.com",
        name: "Jane Doe",
        location: "Nairobi",
        orders: 2,
        revenue: 2000,
      },
      {
        key: "john@example.com",
        name: "John Smith",
        location: "Mombasa",
        orders: 1,
        revenue: 800,
      },
    ]);
  });
});
