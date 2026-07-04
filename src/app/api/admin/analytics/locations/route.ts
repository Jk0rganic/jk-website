import { summarizeLocations } from "@/lib/admin/analytics-service";
import { analyticsErrorResponse, getAnalyticsRouteContext } from "../_lib";

export async function GET(request: Request) {
  const context = await getAnalyticsRouteContext(request);

  if (context instanceof Response) {
    return context;
  }

  try {
    const locationSummary = summarizeLocations(context.orders);

    return Response.json({
      dateRange: context.dateRange,
      rows: locationSummary.topLocations,
      deliveryTypeSplit: locationSummary.deliveryTypeSplit,
    });
  } catch (error) {
    return analyticsErrorResponse(error);
  }
}
