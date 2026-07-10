import { summarizeProducts } from "@/lib/admin/analytics-service";
import { fetchWoo } from "@/lib/fetch/fetchRest";
import { analyticsErrorResponse, getAnalyticsRouteContext } from "../_lib";

const MAX_PRODUCT_CATALOG_PAGES = 5;
const PRODUCT_CATALOG_PAGE_SIZE = 100;

type WooCatalogProduct = {
  id: number;
  name: string;
};

function money(value: string | number | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function fetchProductCatalog() {
  const catalog: WooCatalogProduct[] = [];

  for (let page = 1; page <= MAX_PRODUCT_CATALOG_PAGES; page++) {
    const batch = await fetchWoo<WooCatalogProduct[]>(
      `products?per_page=${PRODUCT_CATALOG_PAGE_SIZE}&page=${page}&status=any`,
      { noCache: true },
    );

    if (!batch.length) break;

    catalog.push(
      ...batch.map((product) => ({ id: product.id, name: product.name })),
    );

    if (batch.length < PRODUCT_CATALOG_PAGE_SIZE) break;
  }

  return catalog;
}

export async function GET(request: Request) {
  const context = await getAnalyticsRouteContext(request);

  if (context instanceof Response) {
    return context;
  }

  try {
    const productSummary = summarizeProducts(
      context.orders,
      await fetchProductCatalog(),
    );
    const orderIdsByProduct = new Map<number, Set<number>>();

    for (const order of context.orders) {
      for (const item of order.line_items ?? []) {
        const orderIds = orderIdsByProduct.get(item.product_id) ?? new Set();
        orderIds.add(order.id);
        orderIdsByProduct.set(item.product_id, orderIds);
      }
    }

    return Response.json({
      dateRange: context.dateRange,
      rows: productSummary.topProducts.map((product, index) => {
        const orderCount = orderIdsByProduct.get(product.productId)?.size ?? 0;

        return {
          ...product,
          orderCount,
          averageItemValue: product.unitsSold
            ? money(product.revenue) / product.unitsSold
            : 0,
          trend: null,
          status:
            index === 0
              ? "Top seller"
              : product.unitsSold <= 1
                ? "Slow mover"
                : "Active",
        };
      }),
      productsWithNoSales: productSummary.productsWithNoSales.map(
        (product) => ({
          productId: product.id,
          name: product.name,
          unitsSold: 0,
          revenue: 0,
          orderCount: 0,
          averageItemValue: 0,
          trend: null,
          status: "No sales",
        }),
      ),
    });
  } catch (error) {
    return analyticsErrorResponse(error);
  }
}
