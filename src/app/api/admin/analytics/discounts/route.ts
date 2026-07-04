import { summarizeDiscounts } from "@/lib/admin/analytics-service";
import { analyticsErrorResponse, getAnalyticsRouteContext } from "../_lib";

function money(value: string | number | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

type OrderWithDiscountFields = DashboardOrder & {
  discount_total?: string | number;
  total_discount?: string | number;
};

function lineItemSubtotal(item: Partial<LineItem>): number {
  return money(item.subtotal || item.total);
}

function lineItemTotal(item: Partial<LineItem>): number {
  return money(item.total);
}

function orderDiscount(order: OrderWithDiscountFields): number {
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

function buildDiscountRevenueByCode(orders: DashboardOrder[]) {
  const revenueByCode = new Map<
    string,
    { grossRevenue: number; revenueAfterDiscount: number }
  >();

  for (const order of orders) {
    const codes =
      order.coupon_lines
        ?.map((coupon) => coupon.code?.trim().toUpperCase())
        .filter((code): code is string => Boolean(code)) ?? [];
    const distinctCodes = new Set(codes);
    const orderRevenueAfterDiscount = money(order.total);
    const orderGrossRevenue = orderRevenueAfterDiscount + orderDiscount(order);

    for (const code of distinctCodes) {
      const current = revenueByCode.get(code) ?? {
        grossRevenue: 0,
        revenueAfterDiscount: 0,
      };

      current.grossRevenue += orderGrossRevenue;
      current.revenueAfterDiscount += orderRevenueAfterDiscount;
      revenueByCode.set(code, current);
    }
  }

  return revenueByCode;
}

export async function GET(request: Request) {
  const context = await getAnalyticsRouteContext(request);

  if (context instanceof Response) {
    return context;
  }

  try {
    const discountSummary = summarizeDiscounts(context.orders);
    const revenueByCode = buildDiscountRevenueByCode(context.orders);

    return Response.json({
      dateRange: context.dateRange,
      summary: {
        totalDiscounts: discountSummary.totalDiscounts,
        discountedOrders: discountSummary.discountedOrders,
        couponCount: discountSummary.couponCount,
      },
      rows: discountSummary.coupons.map((coupon) => {
        const revenue = revenueByCode.get(coupon.code) ?? {
          grossRevenue: 0,
          revenueAfterDiscount: 0,
        };

        return {
          ...coupon,
          grossRevenue: revenue.grossRevenue,
          revenueAfterDiscount: revenue.revenueAfterDiscount,
          averageDiscountPerOrder: coupon.orders
            ? coupon.discount / coupon.orders
            : 0,
        };
      }),
    });
  } catch (error) {
    return analyticsErrorResponse(error);
  }
}
