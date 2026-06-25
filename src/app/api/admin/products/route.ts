import { requireAdminSession } from "@/lib/admin/require-admin";
import { fetchWoo } from "@/lib/fetch/fetchRest";
import {
  createProductPayload,
  mapWooProduct,
  type ProductInventoryItem,
} from "@/lib/admin/product-inventory";
import { productFormSchema } from "@/lib/admin/product-schema";

const MAX_PAGES = 5;
const PER_PAGE = 100;

export async function GET() {
  const { error, status } = await requireAdminSession();

  if (error) {
    return Response.json({ error }, { status });
  }

  try {
    const products: ProductInventoryItem[] = [];

    for (let page = 1; page <= MAX_PAGES; page++) {
      const batch = await fetchWoo<
        Array<Parameters<typeof mapWooProduct>[0]>
      >(`products?per_page=${PER_PAGE}&page=${page}&status=any`, {
        noCache: true,
      });

      if (!batch.length) break;

      products.push(...batch.map(mapWooProduct));

      if (batch.length < PER_PAGE) break;
    }

    return Response.json({ products });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch products";
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

  const parsed = productFormSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid product data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const product = await fetchWoo("products", {
      method: "POST",
      body: createProductPayload(parsed.data),
      noCache: true,
    });

    return Response.json({ product }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create product";
    return Response.json({ error: message }, { status: 500 });
  }
}
