type OrderWithAnalyticsFields = DashboardOrder & {
  discount_total?: string | number;
  total_discount?: string | number;
  coupon_lines?: Array<{ code?: string; discount?: string | number }>;
};

export type AnalyticsCatalogProduct = {
  id: number;
  name: string;
};

export type RevenueSummary = {
  grossProductSales: number;
  totalOrderRevenue: number;
  totalDeliveryFees: number;
  totalDiscounts: number;
  averageOrderValue: number;
  unitsSold: number;
  orderCount: number;
};

export type PaymentSummary = {
  cashTotal: number;
  mpesaIntasendTotal: number;
  otherTotal: number;
  cashOrders: number;
  mpesaIntasendOrders: number;
  otherOrders: number;
};

export type ProductSummary = {
  topProducts: Array<{
    productId: number;
    name: string;
    unitsSold: number;
    revenue: number;
  }>;
  productsWithNoSales: AnalyticsCatalogProduct[];
};

export type LocationSummary = {
  topLocations: Array<{ location: string; orders: number; revenue: number }>;
  deliveryTypeSplit: Array<{ type: string; orders: number; revenue: number }>;
};

export type DiscountSummary = {
  totalDiscounts: number;
  discountedOrders: number;
  couponCount: number;
  coupons: Array<{ code: string; orders: number; discount: number }>;
};

export type OrderBehaviorSummary = {
  orderCount: number;
  unpaidOrPendingOrders: number;
  unpaidPendingRate: number;
  averageOrderValue: number;
  unitsSold: number;
};

function money(value: string | number | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function orderTotal(order: Pick<DashboardOrder, "total">): number {
  return money(order.total);
}

function lineItemSubtotal(item: Partial<LineItem>): number {
  return money(item.subtotal || item.total);
}

function lineItemTotal(item: Partial<LineItem>): number {
  return money(item.total);
}

function orderDiscount(order: OrderWithAnalyticsFields): number {
  const explicitDiscount = money(order.discount_total ?? order.total_discount);
  if (explicitDiscount > 0) return explicitDiscount;

  const couponDiscount = (order.coupon_lines ?? []).reduce(
    (sum, coupon) => sum + money(coupon.discount),
    0,
  );
  if (couponDiscount > 0) return couponDiscount;

  return (order.line_items ?? []).reduce(
    (sum, item) =>
      sum + Math.max(0, lineItemSubtotal(item) - lineItemTotal(item)),
    0,
  );
}

function metaValue(order: DashboardOrder, key: string): string | undefined {
  return order.meta_data?.find((meta) => meta.key === key)?.value?.trim();
}

function paymentBucket(order: DashboardOrder): "cash" | "mpesa" | "other" {
  const method = [order.payment_method, order.payment_method_title]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (method.includes("cod") || method.includes("cash")) return "cash";
  if (
    method.includes("intasend") ||
    method.includes("mpesa") ||
    method.includes("m-pesa")
  ) {
    return "mpesa";
  }

  return "other";
}

function deliveryType(order: DashboardOrder): string {
  const explicitType =
    metaValue(order, "delivery_subtype") || metaValue(order, "delivery_method");
  if (explicitType) return explicitType;

  const shippingTitle = order.shipping_lines?.[0]?.method_title?.toLowerCase();
  if (shippingTitle?.includes("pickup")) return "pickup";
  if (shippingTitle?.includes("parcel")) return "parcel_office";
  if (shippingTitle) return "door_to_door";

  return "unknown";
}

function normalizeLocation(location: string): string {
  return location.replace(/\s+county$/i, "").trim() || "Unknown";
}

function orderLocation(order: DashboardOrder): string {
  const location =
    metaValue(order, "_county") ||
    metaValue(order, "county") ||
    metaValue(order, "parcel_town") ||
    order.billing?.state ||
    order.shipping?.state ||
    order.billing?.city ||
    order.shipping?.city ||
    "Unknown";

  return normalizeLocation(location);
}

export function summarizeRevenue(
  orders: OrderWithAnalyticsFields[],
): RevenueSummary {
  const totalOrderRevenue = orders.reduce(
    (sum, order) => sum + orderTotal(order),
    0,
  );
  const unitsSold = orders.reduce(
    (sum, order) =>
      sum +
      (order.line_items ?? []).reduce(
        (lineSum, item) => lineSum + (item.quantity || 0),
        0,
      ),
    0,
  );

  return {
    grossProductSales: orders.reduce(
      (sum, order) =>
        sum +
        (order.line_items ?? []).reduce(
          (lineSum, item) => lineSum + lineItemSubtotal(item),
          0,
        ),
      0,
    ),
    totalOrderRevenue,
    totalDeliveryFees: orders.reduce(
      (sum, order) =>
        sum +
        (order.shipping_lines ?? []).reduce(
          (lineSum, line) => lineSum + money(line.total),
          0,
        ),
      0,
    ),
    totalDiscounts: orders.reduce(
      (sum, order) => sum + orderDiscount(order),
      0,
    ),
    averageOrderValue: orders.length
      ? roundCurrency(totalOrderRevenue / orders.length)
      : 0,
    unitsSold,
    orderCount: orders.length,
  };
}

export function summarizePayments(orders: DashboardOrder[]): PaymentSummary {
  return orders.reduce<PaymentSummary>(
    (summary, order) => {
      const total = orderTotal(order);
      const bucket = paymentBucket(order);

      if (bucket === "cash") {
        summary.cashTotal += total;
        summary.cashOrders += 1;
      } else if (bucket === "mpesa") {
        summary.mpesaIntasendTotal += total;
        summary.mpesaIntasendOrders += 1;
      } else {
        summary.otherTotal += total;
        summary.otherOrders += 1;
      }

      return summary;
    },
    {
      cashTotal: 0,
      mpesaIntasendTotal: 0,
      otherTotal: 0,
      cashOrders: 0,
      mpesaIntasendOrders: 0,
      otherOrders: 0,
    },
  );
}

export function summarizeProducts(
  orders: DashboardOrder[],
  catalog: AnalyticsCatalogProduct[] = [],
): ProductSummary {
  const products = new Map<number, ProductSummary["topProducts"][number]>();

  for (const order of orders) {
    for (const item of order.line_items ?? []) {
      const productId = item.product_id;
      const current = products.get(productId) ?? {
        productId,
        name: item.name,
        unitsSold: 0,
        revenue: 0,
      };
      current.unitsSold += item.quantity || 0;
      current.revenue += lineItemTotal(item);
      products.set(productId, current);
    }
  }

  const topProducts = Array.from(products.values()).sort(
    (a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue,
  );
  const soldProductIds = new Set(
    topProducts.map((product) => product.productId),
  );

  return {
    topProducts,
    productsWithNoSales: catalog.filter(
      (product) => !soldProductIds.has(product.id),
    ),
  };
}

export function summarizeLocations(orders: DashboardOrder[]): LocationSummary {
  const locations = new Map<
    string,
    { location: string; orders: number; revenue: number }
  >();
  const deliveryTypes = new Map<
    string,
    { type: string; orders: number; revenue: number }
  >();

  for (const order of orders) {
    const revenue = orderTotal(order);
    const location = orderLocation(order);
    const locationSummary = locations.get(location) ?? {
      location,
      orders: 0,
      revenue: 0,
    };
    locationSummary.orders += 1;
    locationSummary.revenue += revenue;
    locations.set(location, locationSummary);

    const type = deliveryType(order);
    const typeSummary = deliveryTypes.get(type) ?? {
      type,
      orders: 0,
      revenue: 0,
    };
    typeSummary.orders += 1;
    typeSummary.revenue += revenue;
    deliveryTypes.set(type, typeSummary);
  }

  return {
    topLocations: Array.from(locations.values()).sort(
      (a, b) => b.orders - a.orders || b.revenue - a.revenue,
    ),
    deliveryTypeSplit: Array.from(deliveryTypes.values()).sort((a, b) => {
      const order = ["door_to_door", "pickup", "parcel_office"];
      const aIndex = order.indexOf(a.type);
      const bIndex = order.indexOf(b.type);

      if (aIndex !== bIndex) {
        return (
          (aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex) -
          (bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex)
        );
      }

      return a.type.localeCompare(b.type);
    }),
  };
}

export function summarizeDiscounts(
  orders: OrderWithAnalyticsFields[],
): DiscountSummary {
  const coupons = new Map<
    string,
    { code: string; orders: number; discount: number }
  >();
  let discountedOrders = 0;

  for (const order of orders) {
    if (orderDiscount(order) > 0) discountedOrders += 1;

    for (const coupon of order.coupon_lines ?? []) {
      const code = coupon.code?.trim().toUpperCase();
      if (!code) continue;

      const current = coupons.get(code) ?? { code, orders: 0, discount: 0 };
      current.orders += 1;
      current.discount += money(coupon.discount);
      coupons.set(code, current);
    }
  }

  return {
    totalDiscounts: orders.reduce(
      (sum, order) => sum + orderDiscount(order),
      0,
    ),
    discountedOrders,
    couponCount: Array.from(coupons.values()).reduce(
      (sum, coupon) => sum + coupon.orders,
      0,
    ),
    coupons: Array.from(coupons.values()).sort(
      (a, b) => b.discount - a.discount || a.code.localeCompare(b.code),
    ),
  };
}

export function summarizeOrderBehavior(
  orders: DashboardOrder[],
): OrderBehaviorSummary {
  const totalOrderRevenue = orders.reduce(
    (sum, order) => sum + orderTotal(order),
    0,
  );
  const unitsSold = orders.reduce(
    (sum, order) =>
      sum +
      (order.line_items ?? []).reduce(
        (lineSum, item) => lineSum + (item.quantity || 0),
        0,
      ),
    0,
  );
  const unpaidOrPendingOrders = orders.filter(
    (order) =>
      order.needs_payment ||
      order.status === "pending" ||
      order.status === "on-hold",
  ).length;

  return {
    orderCount: orders.length,
    unpaidOrPendingOrders,
    unpaidPendingRate: orders.length
      ? roundCurrency((unpaidOrPendingOrders / orders.length) * 100)
      : 0,
    averageOrderValue: orders.length
      ? roundCurrency(totalOrderRevenue / orders.length)
      : 0,
    unitsSold,
  };
}

export function buildAnalyticsOverview(
  orders: OrderWithAnalyticsFields[],
  catalog: AnalyticsCatalogProduct[] = [],
) {
  return {
    revenue: summarizeRevenue(orders),
    payments: summarizePayments(orders),
    products: summarizeProducts(orders, catalog),
    locations: summarizeLocations(orders),
    discounts: summarizeDiscounts(orders),
    behavior: summarizeOrderBehavior(orders),
  };
}
