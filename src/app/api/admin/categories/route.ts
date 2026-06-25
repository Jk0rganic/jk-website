import { requireAdminSession } from "@/lib/admin/require-admin";
import { fetchWoo } from "@/lib/fetch/fetchRest";
import type { WooCategory } from "@/lib/admin/product-service";

export async function GET() {
  const { error, status } = await requireAdminSession();

  if (error) {
    return Response.json({ error }, { status });
  }

  try {
    const categories = await fetchWoo<WooCategory[]>(
      "products/categories?per_page=100&orderby=name&order=asc",
      { noCache: true },
    );

    return Response.json({ categories });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch categories";
    return Response.json({ error: message }, { status: 500 });
  }
}
