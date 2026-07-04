import { summarizeDiscounts } from "@/lib/admin/analytics-service";
import { analyticsErrorResponse, getAnalyticsRouteContext } from "../_lib";

export async function GET(request: Request) {
  const context = await getAnalyticsRouteContext(request);

  if (context instanceof Response) {
    return context;
  }

  try {
    const discountSummary = summarizeDiscounts(context.orders);

    return Response.json({
      dateRange: context.dateRange,
      summary: {
        totalDiscounts: discountSummary.totalDiscounts,
        discountedOrders: discountSummary.discountedOrders,
        couponCount: discountSummary.couponCount,
      },
      rows: discountSummary.coupons,
    });
  } catch (error) {
    return analyticsErrorResponse(error);
  }
}
