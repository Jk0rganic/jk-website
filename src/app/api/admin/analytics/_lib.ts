import {
  type AnalyticsDatePreset,
  type AnalyticsDateRange,
  resolveAnalyticsDateRange,
} from "@/lib/admin/analytics-date";
import { fetchAdminOrders } from "@/lib/admin/fetch-admin-orders";
import { requireAdminSession } from "@/lib/admin/require-admin";

const DEFAULT_PRESET: AnalyticsDatePreset = "last_7_days";
const ANALYTICS_ERROR = "Failed to load analytics";
const DATE_PRESETS = new Set<AnalyticsDatePreset>([
  "today",
  "yesterday",
  "last_7_days",
  "month_to_date",
  "last_month",
  "year_to_date",
  "custom",
]);

export type AnalyticsRouteContext = {
  dateRange: AnalyticsDateRange;
  orders: DashboardOrder[];
  searchParams: URLSearchParams;
};

export function analyticsErrorResponse(error: unknown) {
  console.error("Failed to load admin analytics", error);
  return Response.json({ error: ANALYTICS_ERROR }, { status: 500 });
}

export function resolveDateRange(searchParams: URLSearchParams) {
  const requestedPreset = searchParams.get("preset");
  const preset =
    requestedPreset && DATE_PRESETS.has(requestedPreset as AnalyticsDatePreset)
      ? (requestedPreset as AnalyticsDatePreset)
      : DEFAULT_PRESET;

  return resolveAnalyticsDateRange({
    preset,
    after: searchParams.get("after") || undefined,
    before: searchParams.get("before") || undefined,
  });
}

export async function fetchOrdersForDateRange(dateRange: AnalyticsDateRange) {
  return fetchAdminOrders({
    after: dateRange.after,
    before: dateRange.before,
  });
}

export async function getAnalyticsRouteContext(
  request: Request,
): Promise<AnalyticsRouteContext | Response> {
  const { error, status } = await requireAdminSession();

  if (error) {
    return Response.json({ error }, { status });
  }

  try {
    const searchParams = new URL(request.url).searchParams;
    const dateRange = resolveDateRange(searchParams);
    const orders = await fetchOrdersForDateRange(dateRange);

    return { dateRange, orders, searchParams };
  } catch (error) {
    return analyticsErrorResponse(error);
  }
}
