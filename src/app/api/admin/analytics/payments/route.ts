import { summarizePayments } from "@/lib/admin/analytics-service";
import { analyticsErrorResponse, getAnalyticsRouteContext } from "../_lib";

export async function GET(request: Request) {
  const context = await getAnalyticsRouteContext(request);

  if (context instanceof Response) {
    return context;
  }

  try {
    return Response.json({
      dateRange: context.dateRange,
      summary: summarizePayments(context.orders),
    });
  } catch (error) {
    return analyticsErrorResponse(error);
  }
}
