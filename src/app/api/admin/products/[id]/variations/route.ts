import { requireAdminSession } from "@/lib/admin/require-admin";
import { variationToWooPayload } from "@/lib/admin/product-service";
import { variationFormSchema } from "@/lib/admin/product-schema";
import { fetchWoo } from "@/lib/fetch/fetchRest";
import { z } from "zod";

const batchSchema = z.object({
  variations: z.array(variationFormSchema),
});

type RouteParams = { params: Promise<{ id: string }> };

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

  const parsed = batchSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid variation data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const updated = [];

    for (const variation of parsed.data.variations) {
      const result = await fetchWoo(
        `products/${productId}/variations/${variation.id}`,
        {
          method: "PUT",
          body: variationToWooPayload(variation),
          noCache: true,
        },
      );
      updated.push(result);
    }

    return Response.json({ variations: updated });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update variations";
    return Response.json({ error: message }, { status: 500 });
  }
}
