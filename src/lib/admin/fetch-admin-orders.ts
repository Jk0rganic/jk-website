import { fetchWoo } from "@/lib/fetch/fetchRest";

const MAX_PAGES = 10;
const PER_PAGE = 100;

export type AdminOrderFilters = {
  status?: string;
  search?: string;
  after?: string;
  before?: string;
  dateType?: "created" | "modified" | "paid" | "completed";
};

export function buildOrdersQuery(
  filters: AdminOrderFilters = {},
  page = 1,
  perPage = PER_PAGE,
): string {
  const params = new URLSearchParams({
    per_page: String(perPage),
    page: String(page),
    orderby: "date",
    order: "desc",
  });

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters.after) {
    params.set("after", filters.after);
  }

  if (filters.before) {
    params.set("before", filters.before);
  }

  if (filters.dateType) {
    params.set("dates_are", filters.dateType);
  }

  return `orders?${params.toString()}`;
}

export async function fetchAdminOrders(
  filters: AdminOrderFilters = {},
): Promise<DashboardOrder[]> {
  const allOrders: DashboardOrder[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const endpoint = buildOrdersQuery(filters, page);
    const batch = await fetchWoo<DashboardOrder[]>(endpoint, { noCache: true });

    if (!batch.length) {
      break;
    }

    allOrders.push(...batch);

    if (batch.length < PER_PAGE) {
      break;
    }
  }

  return allOrders;
}
