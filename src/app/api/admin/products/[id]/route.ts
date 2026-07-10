import { productFormSchema } from "@/lib/admin/product-schema";
import {
  formValuesToWooPayload,
  mapWooProductDetail,
  mapWooVariation,
  type WooProductDetail,
  type WooVariation,
} from "@/lib/admin/product-service";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { fetchWoo } from "@/lib/fetch/fetchRest";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { error, status } = await requireAdminSession();

  if (error) {
    return Response.json({ error }, { status });
  }

  const { id } = await params;
  const productId = Number(id);

  if (!Number.isFinite(productId)) {
    return Response.json({ error: "Invalid product id" }, { status: 400 });
  }

  try {
    const wooProduct = await fetchWoo<WooProductDetail>(
      `products/${productId}`,
      {
        noCache: true,
      },
    );

    const product = mapWooProductDetail(wooProduct);

    if (wooProduct.type === "variable") {
      const variations = await fetchWoo<WooVariation[]>(
        `products/${productId}/variations?per_page=100`,
        { noCache: true },
      );
      product.variations = variations.map(mapWooVariation);
    }

    return Response.json({ product });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch product";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { error, status } = await requireAdminSession();

  if (error) {
    return Response.json({ error }, { status });
  }

  const { id } = await params;
  const productId = Number(id);

  if (!Number.isFinite(productId)) {
    return Response.json({ error: "Invalid product id" }, { status: 400 });
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
    const product = await fetchWoo(`products/${productId}`, {
      method: "PUT",
      body: formValuesToWooPayload(parsed.data),
      noCache: true,
    });

    return Response.json({ product });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update product";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { error, status } = await requireAdminSession();

  if (error) {
    return Response.json({ error }, { status });
  }

  const { id } = await params;
  const productId = Number(id);

  if (!Number.isFinite(productId)) {
    return Response.json({ error: "Invalid product id" }, { status: 400 });
  }

  try {
    await fetchWoo(`products/${productId}?force=true`, {
      method: "DELETE",
      noCache: true,
    });

    return Response.json({ success: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete product";
    return Response.json({ error: message }, { status: 500 });
  }
}
