export type WeeklyStats = {
  sales: number;
  orders: number;
  products: number;
};

export type PeriodComparison = {
  thisWeek: WeeklyStats;
  lastWeek: WeeklyStats;
};

export type MonthlyChartPoint = {
  month: string;
  revenue: number;
  orders: number;
};

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

type OrderLike = {
  total: string;
  date_created: string;
  line_items?: Array<{ quantity: number }>;
};

function parseOrderTotal(total: string | number): number {
  return Number(total || 0);
}

export function computeWeeklyComparison(
  orders: OrderLike[],
  now = new Date(),
): PeriodComparison {
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - 7);

  const startOfLastWeek = new Date(now);
  startOfLastWeek.setDate(now.getDate() - 14);

  const normalized = orders.map((order) => ({
    total: parseOrderTotal(order.total),
    date: new Date(order.date_created),
    line_items: order.line_items,
  }));

  const thisWeekOrders = normalized.filter(
    (o) => o.date >= startOfThisWeek && o.date <= now,
  );

  const lastWeekOrders = normalized.filter(
    (o) => o.date >= startOfLastWeek && o.date < startOfThisWeek,
  );

  const getProductsSoldFromNormalized = (
    items: Array<{ line_items?: Array<{ quantity: number }> }>,
  ) =>
    items.reduce((sum, order) => {
      const lineItems = order.line_items ?? [];
      return (
        sum + lineItems.reduce((qty, item) => qty + (item.quantity || 0), 0)
      );
    }, 0);

  return {
    thisWeek: {
      sales: thisWeekOrders.reduce((sum, o) => sum + o.total, 0),
      orders: thisWeekOrders.length,
      products: getProductsSoldFromNormalized(thisWeekOrders),
    },
    lastWeek: {
      sales: lastWeekOrders.reduce((sum, o) => sum + o.total, 0),
      orders: lastWeekOrders.length,
      products: getProductsSoldFromNormalized(lastWeekOrders),
    },
  };
}

export function computeMonthlyChartData(
  orders: OrderLike[],
  year: number,
): MonthlyChartPoint[] {
  const map = MONTH_LABELS.map((month) => ({
    month,
    revenue: 0,
    orders: 0,
  }));

  for (const order of orders) {
    const date = new Date(order.date_created);
    if (date.getFullYear() !== year) continue;

    const index = date.getMonth();
    map[index].revenue += parseOrderTotal(order.total);
    map[index].orders += 1;
  }

  return map;
}

export function getOrderYears(orders: OrderLike[], fallbackYear?: number): number[] {
  const years = new Set<number>();

  for (const order of orders) {
    years.add(new Date(order.date_created).getFullYear());
  }

  if (!years.size && fallbackYear) {
    years.add(fallbackYear);
  }

  return Array.from(years).sort((a, b) => b - a);
}

export function computeYearOverYearGrowth(
  orders: OrderLike[],
  year: number,
): { currentYearTotal: number; percentage: number; isUp: boolean } {
  const currentYearTotal = orders
    .filter((o) => new Date(o.date_created).getFullYear() === year)
    .reduce((sum, o) => sum + parseOrderTotal(o.total), 0);

  const previousYearTotal = orders
    .filter((o) => new Date(o.date_created).getFullYear() === year - 1)
    .reduce((sum, o) => sum + parseOrderTotal(o.total), 0);

  let percentage = 0;

  if (previousYearTotal === 0 && currentYearTotal > 0) {
    percentage = 100;
  } else if (previousYearTotal !== 0) {
    percentage =
      ((currentYearTotal - previousYearTotal) / previousYearTotal) * 100;
    percentage = Math.max(-100, Math.min(100, percentage));
  }

  return {
    currentYearTotal,
    percentage,
    isUp: percentage >= 0,
  };
}

export function filterOrders(
  orders: DashboardOrder[],
  filters: { status?: string; search?: string; paymentMethod?: string },
): DashboardOrder[] {
  return orders.filter((order) => {
    if (filters.status && order.status !== filters.status) {
      return false;
    }

    if (filters.paymentMethod && order.payment_method !== filters.paymentMethod) {
      return false;
    }

    if (filters.search?.trim()) {
      const query = filters.search.trim().toLowerCase();
      const haystack = [
        String(order.id),
        order.billing?.email,
        order.billing?.first_name,
        order.billing?.last_name,
        order.billing?.phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(query)) {
        return false;
      }
    }

    return true;
  });
}

export const ORDER_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "on-hold", label: "On hold" },
  { value: "refunded", label: "Refunded" },
] as const;

export const PAYMENT_METHOD_OPTIONS = [
  { value: "", label: "All payments" },
  { value: "intasend", label: "M-Pesa (IntaSend)" },
  { value: "cod", label: "Cash on delivery" },
] as const;
