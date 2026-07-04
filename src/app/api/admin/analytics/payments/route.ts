import { summarizePayments } from "@/lib/admin/analytics-service";
import { analyticsErrorResponse, getAnalyticsRouteContext } from "../_lib";

type PaymentReportRow = {
  method: string;
  paidTotal: number;
  orderCount: number;
  pendingCount: number;
  failedCount: number;
  pendingRate: number;
};

function money(value: string | number | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function paymentBucket(order: DashboardOrder): "Cash" | "M-Pesa" | "Other" {
  const method = [order.payment_method, order.payment_method_title]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (method.includes("cod") || method.includes("cash")) return "Cash";
  if (
    method.includes("intasend") ||
    method.includes("mpesa") ||
    method.includes("m-pesa")
  ) {
    return "M-Pesa";
  }

  return "Other";
}

function isCollectedOrder(order: DashboardOrder): boolean {
  return (
    !order.needs_payment &&
    !["pending", "on-hold", "failed", "cancelled", "refunded"].includes(
      order.status,
    )
  );
}

function buildPaymentRows(orders: DashboardOrder[]): PaymentReportRow[] {
  const rows = new Map<string, PaymentReportRow>();

  for (const order of orders) {
    const method = paymentBucket(order);
    const row = rows.get(method) ?? {
      method,
      paidTotal: 0,
      orderCount: 0,
      pendingCount: 0,
      failedCount: 0,
      pendingRate: 0,
    };

    row.orderCount += 1;
    if (isCollectedOrder(order)) row.paidTotal += money(order.total);
    if (order.needs_payment || ["pending", "on-hold"].includes(order.status)) {
      row.pendingCount += 1;
    }
    if (["failed", "cancelled", "refunded"].includes(order.status)) {
      row.failedCount += 1;
    }

    rows.set(method, row);
  }

  return Array.from(rows.values())
    .map((row) => ({
      ...row,
      pendingRate: row.orderCount
        ? (row.pendingCount / row.orderCount) * 100
        : 0,
    }))
    .sort((a, b) => b.orderCount - a.orderCount || b.paidTotal - a.paidTotal);
}

export async function GET(request: Request) {
  const context = await getAnalyticsRouteContext(request);

  if (context instanceof Response) {
    return context;
  }

  try {
    return Response.json({
      dateRange: context.dateRange,
      summary: summarizePayments(context.orders),
      rows: buildPaymentRows(context.orders),
    });
  } catch (error) {
    return analyticsErrorResponse(error);
  }
}
