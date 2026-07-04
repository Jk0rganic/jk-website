import {
  type AnalyticsDateRange,
  getComparisonRange,
} from "@/lib/admin/analytics-date";
import { buildAnalyticsOverview } from "@/lib/admin/analytics-service";
import {
  analyticsErrorResponse,
  fetchOrdersForDateRange,
  getAnalyticsRouteContext,
} from "../_lib";

function shouldCompare(searchParams: URLSearchParams) {
  return searchParams.get("compare") === "true";
}

async function comparisonOverview(dateRange: AnalyticsDateRange) {
  const comparisonRange = getComparisonRange(dateRange);
  const comparisonOrders = await fetchOrdersForDateRange(comparisonRange);

  return {
    comparisonRange,
    comparisonOverview: buildAnalyticsOverview(comparisonOrders),
  };
}

export async function GET(request: Request) {
  const context = await getAnalyticsRouteContext(request);

  if (context instanceof Response) {
    return context;
  }

  try {
    const response = {
      dateRange: context.dateRange,
      overview: buildAnalyticsOverview(context.orders),
    };

    if (!shouldCompare(context.searchParams)) {
      return Response.json(response);
    }

    return Response.json({
      ...response,
      ...(await comparisonOverview(context.dateRange)),
    });
  } catch (error) {
    return analyticsErrorResponse(error);
  }
}
