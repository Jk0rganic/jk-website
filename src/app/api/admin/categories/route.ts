import type { WooCategory } from "@/lib/admin/product-service";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { fetchWoo } from "@/lib/fetch/fetchRest";

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

export async function POST(request: Request) {
  const { error, status } = await requireAdminSession();

  if (error) {
    return Response.json({ error }, { status });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name =
    typeof body === "object" &&
    body !== null &&
    "name" in body &&
    typeof body.name === "string"
      ? body.name.trim()
      : "";

  if (!name) {
    return Response.json(
      { error: "Category name is required" },
      { status: 400 },
    );
  }

  try {
    const category = await fetchWoo<WooCategory>("products/categories", {
      method: "POST",
      body: { name },
      noCache: true,
    });

    return Response.json({ category }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create category";
    return Response.json({ error: message }, { status: 500 });
  }
}
