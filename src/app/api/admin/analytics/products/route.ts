import { summarizeProducts } from "@/lib/admin/analytics-service";
import { analyticsErrorResponse, getAnalyticsRouteContext } from "../_lib";

export async function GET(request: Request) {
  const context = await getAnalyticsRouteContext(request);

  if (context instanceof Response) {
    return context;
  }

  try {
    const productSummary = summarizeProducts(context.orders);

    return Response.json({
      dateRange: context.dateRange,
      rows: productSummary.topProducts,
      productsWithNoSales: productSummary.productsWithNoSales,
    });
  } catch (error) {
    return analyticsErrorResponse(error);
  }
}
