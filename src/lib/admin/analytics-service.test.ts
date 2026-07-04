import { describe, expect, it } from "vitest";
import {
  buildAnalyticsOverview,
  summarizeDiscounts,
  summarizeLocations,
  summarizeOrderBehavior,
  summarizePayments,
  summarizeProducts,
  summarizeRevenue,
} from "./analytics-service";

const order = (overrides: Partial<DashboardOrder> = {}): DashboardOrder => ({
  id: 100,
  status: "processing",
  date_created: "2026-07-01T10:00:00",
  total: "1800",
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
    state: "Nairobi County",
  },
  shipping: {
    first_name: "Jane",
    last_name: "Doe",
    address_1: "Nairobi",
    city: "Nairobi",
    postcode: "00100",
    phone: "0712345678",
    country: "KE",
    state: "Nairobi County",
  },
  line_items: [
    {
      product_id: 1,
      name: "Aloe Balm",
      quantity: 2,
      subtotal: "1200",
      total: "1000",
      sku: "ALOE",
      meta_data: [],
    },
  ],
  shipping_lines: [
    { method_id: "flat_rate", method_title: "Door Delivery", total: "300" },
  ],
  payment_method: "cod",
  payment_method_title: "Cash on Delivery",
  date_paid: null,
  needs_payment: false,
  meta_data: [
    { key: "_county", value: "Nairobi" },
    { key: "_delivery_type", value: "door_to_door" },
  ],
  customer_note: "",
  ...overrides,
});

const orders: DashboardOrder[] = [
  order({
    id: 1,
    total: "1300",
    line_items: [
      {
        product_id: 1,
        name: "Aloe Balm",
        quantity: 2,
        subtotal: "1200",
        total: "1000",
        sku: "ALOE",
        meta_data: [],
      },
      {
        product_id: 2,
        name: "Moringa Oil",
        quantity: 1,
        subtotal: "500",
        total: "500",
        sku: "MOR",
        meta_data: [],
      },
    ],
    shipping_lines: [
      { method_id: "flat_rate", method_title: "Door Delivery", total: "300" },
    ],
    discount_total: "200",
    coupon_lines: [{ code: "WELCOME", discount: "200" }],
  }),
  order({
    id: 2,
    status: "completed",
    total: "2100",
    payment_method: "intasend",
    payment_method_title: "M-Pesa via IntaSend",
    date_paid: "2026-07-02T09:00:00",
    line_items: [
      {
        product_id: 1,
        name: "Aloe Balm",
        quantity: 1,
        subtotal: "600",
        total: "600",
        sku: "ALOE",
        meta_data: [],
      },
      {
        product_id: 3,
        name: "Shea Cream",
        quantity: 3,
        subtotal: "1200",
        total: "900",
        sku: "SHEA",
        meta_data: [],
      },
    ],
    shipping_lines: [
      { method_id: "local_pickup", method_title: "Pickup", total: "0" },
    ],
    total_discount: "300",
    coupon_lines: [{ code: "VIP", discount: "300" }],
    meta_data: [
      { key: "_pickup_point_id", value: "jk-organics-hq" },
      { key: "_pickup_point_name", value: "JK Organics HQ" },
    ],
  }),
  order({
    id: 3,
    status: "pending",
    total: "900",
    payment_method: "mpesa",
    payment_method_title: "M-Pesa",
    needs_payment: true,
    billing: {
      ...order().billing,
      city: "Kisumu",
      state: "Kisumu",
    },
    shipping: {
      ...order().shipping,
      city: "Kisumu",
      state: "Kisumu",
    },
    line_items: [
      {
        product_id: 4,
        name: "Neem Soap",
        quantity: 2,
        subtotal: "800",
        total: "800",
        sku: "NEEM",
        meta_data: [],
      },
    ],
    shipping_lines: [
      { method_id: "parcel", method_title: "Parcel Office", total: "100" },
    ],
    meta_data: [
      { key: "_county", value: "Kisumu" },
      { key: "_delivery_type", value: "parcel_office" },
      { key: "_parcel_town", value: "Kisumu" },
      { key: "_parcel_office_name", value: "Kisumu Main Stage" },
    ],
  }),
];

describe("summarizeRevenue", () => {
  it("calculates gross product sales, order revenue, delivery fees, discounts, units, and average order value", () => {
    expect(summarizeRevenue(orders)).toEqual({
      grossProductSales: 4300,
      totalOrderRevenue: 4300,
      totalDeliveryFees: 400,
      totalDiscounts: 500,
      averageOrderValue: 1433.33,
      unitsSold: 9,
      orderCount: 3,
    });
  });
});

describe("summarizePayments", () => {
  it("totals collected cash and M-Pesa or IntaSend revenue without pending payment values", () => {
    expect(summarizePayments(orders)).toEqual({
      cashTotal: 1300,
      mpesaIntasendTotal: 2100,
      otherTotal: 0,
      cashOrders: 1,
      mpesaIntasendOrders: 2,
      otherOrders: 0,
    });
  });
});

describe("summarizeProducts", () => {
  it("returns top products and catalog products with no sales", () => {
    expect(
      summarizeProducts(orders, [
        { id: 1, name: "Aloe Balm" },
        { id: 2, name: "Moringa Oil" },
        { id: 3, name: "Shea Cream" },
        { id: 4, name: "Neem Soap" },
        { id: 5, name: "Baobab Butter" },
      ]),
    ).toEqual({
      topProducts: [
        { productId: 1, name: "Aloe Balm", unitsSold: 3, revenue: 1600 },
        { productId: 3, name: "Shea Cream", unitsSold: 3, revenue: 900 },
        { productId: 4, name: "Neem Soap", unitsSold: 2, revenue: 800 },
        { productId: 2, name: "Moringa Oil", unitsSold: 1, revenue: 500 },
      ],
      productsWithNoSales: [{ id: 5, name: "Baobab Butter" }],
    });
  });
});

describe("summarizeLocations", () => {
  it("uses real checkout metadata, billing or shipping places, parcel town, and pickup points", () => {
    expect(summarizeLocations(orders)).toEqual({
      topLocations: [
        { location: "Nairobi", orders: 2, revenue: 3400 },
        { location: "Kisumu", orders: 1, revenue: 900 },
      ],
      deliveryTypeSplit: [
        { type: "door_to_door", orders: 1, revenue: 1300 },
        { type: "pickup", orders: 1, revenue: 2100 },
        { type: "parcel_office", orders: 1, revenue: 900 },
      ],
    });
  });

  it("ignores non-primitive metadata values without crashing", () => {
    expect(
      summarizeLocations([
        order({
          id: 4,
          total: "400",
          meta_data: [
            { key: "_county", value: { county: "Nairobi" } },
            { key: "_parcel_town", value: ["Kisumu"] },
            { key: "_delivery_type", value: true },
          ] as unknown as OrderMeta[],
        }),
      ]),
    ).toEqual({
      topLocations: [{ location: "Nairobi", orders: 1, revenue: 400 }],
      deliveryTypeSplit: [{ type: "true", orders: 1, revenue: 400 }],
    });
  });
});

describe("summarizeDiscounts", () => {
  it("summarizes discounts and coupon usage", () => {
    expect(summarizeDiscounts(orders)).toEqual({
      totalDiscounts: 500,
      discountedOrders: 2,
      couponCount: 2,
      coupons: [
        { code: "VIP", orders: 1, discount: 300 },
        { code: "WELCOME", orders: 1, discount: 200 },
      ],
    });
  });
});

describe("summarizeOrderBehavior", () => {
  it("calculates unpaid or pending rate, average order value, and units sold", () => {
    expect(summarizeOrderBehavior(orders)).toEqual({
      orderCount: 3,
      unpaidOrPendingOrders: 1,
      unpaidPendingRate: 33.33,
      averageOrderValue: 1433.33,
      unitsSold: 9,
    });
  });
});

describe("buildAnalyticsOverview", () => {
  it("combines all analytics summaries", () => {
    const overview = buildAnalyticsOverview(orders, [
      { id: 5, name: "Baobab Butter" },
    ]);

    expect(overview.revenue.totalOrderRevenue).toBe(4300);
    expect(overview.payments.mpesaIntasendTotal).toBe(2100);
    expect(overview.products.productsWithNoSales).toEqual([
      { id: 5, name: "Baobab Butter" },
    ]);
    expect(overview.locations.topLocations[0]).toEqual({
      location: "Nairobi",
      orders: 2,
      revenue: 3400,
    });
    expect(overview.discounts.totalDiscounts).toBe(500);
    expect(overview.behavior.unpaidPendingRate).toBe(33.33);
  });
});
