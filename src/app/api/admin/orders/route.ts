import { fetchAdminOrders } from "@/lib/admin/fetch-admin-orders";
import { requireAdminSession } from "@/lib/admin/require-admin";

export async function GET(request: Request) {
  const { error, status } = await requireAdminSession();

  if (error) {
    return Response.json({ error }, { status });
  }

  const { searchParams } = new URL(request.url);

  try {
    const orders = await fetchAdminOrders({
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
    });

    return Response.json({ orders });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch orders";
    return Response.json({ error: message }, { status: 500 });
  }
}
