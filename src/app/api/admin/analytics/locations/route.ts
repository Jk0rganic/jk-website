import { summarizeLocations } from "@/lib/admin/analytics-service";
import { analyticsErrorResponse, getAnalyticsRouteContext } from "../_lib";

function money(value: string | number | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function stringifyMetaValue(value: unknown): string | undefined {
  if (
    typeof value !== "string" &&
    typeof value !== "number" &&
    typeof value !== "boolean"
  ) {
    return undefined;
  }

  const text = String(value).trim();
  return text || undefined;
}

function metaValue(order: DashboardOrder, key: string): string | undefined {
  return stringifyMetaValue(
    order.meta_data?.find((meta) => meta.key === key)?.value,
  );
}

function normalizeLocation(location: string): string {
  return location.replace(/\s+county$/i, "").trim() || "Unknown";
}

function orderLocation(order: DashboardOrder): string {
  const location =
    metaValue(order, "_county") ||
    metaValue(order, "_parcel_town") ||
    metaValue(order, "county") ||
    metaValue(order, "parcel_town") ||
    order.billing?.state ||
    order.shipping?.state ||
    order.billing?.city ||
    order.shipping?.city ||
    "Unknown";

  return normalizeLocation(location);
}

function deliveryType(order: DashboardOrder): string {
  const explicitType =
    metaValue(order, "_delivery_type") ||
    metaValue(order, "delivery_subtype") ||
    metaValue(order, "delivery_method");
  if (explicitType) return explicitType;

  if (
    metaValue(order, "_pickup_point_id") ||
    metaValue(order, "_pickup_point_name")
  ) {
    return "pickup";
  }

  const shippingTitle = order.shipping_lines?.[0]?.method_title?.toLowerCase();
  if (shippingTitle?.includes("pickup")) return "pickup";
  if (shippingTitle?.includes("parcel")) return "parcel_office";
  if (shippingTitle) return "door_to_door";

  return "unknown";
}

export async function GET(request: Request) {
  const context = await getAnalyticsRouteContext(request);

  if (context instanceof Response) {
    return context;
  }

  try {
    const locationSummary = summarizeLocations(context.orders);
    const deliveryFeesByLocation = new Map<string, number>();
    const typeCountsByLocation = new Map<string, Map<string, number>>();

    for (const order of context.orders) {
      const location = orderLocation(order);
      const type = deliveryType(order);
      const typeCounts = typeCountsByLocation.get(location) ?? new Map();

      deliveryFeesByLocation.set(
        location,
        (deliveryFeesByLocation.get(location) ?? 0) +
          (order.shipping_lines ?? []).reduce(
            (sum, line) => sum + money(line.total),
            0,
          ),
      );
      typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1);
      typeCountsByLocation.set(location, typeCounts);
    }
    const totalOrders = context.orders.length;

    return Response.json({
      dateRange: context.dateRange,
      rows: locationSummary.topLocations.map((location) => {
        const typeCounts = typeCountsByLocation.get(location.location);
        const topDeliveryType = typeCounts
          ? Array.from(typeCounts.entries()).sort(
              (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
            )[0]?.[0]
          : undefined;

        return {
          ...location,
          deliveryFees: deliveryFeesByLocation.get(location.location) ?? 0,
          topDeliveryType: topDeliveryType ?? "unknown",
          orderShare: totalOrders ? (location.orders / totalOrders) * 100 : 0,
        };
      }),
      deliveryTypeSplit: locationSummary.deliveryTypeSplit,
    });
  } catch (error) {
    return analyticsErrorResponse(error);
  }
}
