import { z } from "zod";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { updateOrder } from "@/lib/fetch/updateOrder";

const updateSchema = z.object({
  status: z.enum([
    "pending",
    "processing",
    "on-hold",
    "completed",
    "cancelled",
    "refunded",
    "failed",
  ]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error, status } = await requireAdminSession();

  if (error) {
    return Response.json({ error }, { status });
  }

  const { id } = await params;
  const orderId = Number(id);

  if (!Number.isFinite(orderId)) {
    return Response.json({ error: "Invalid order id" }, { status: 400 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid status", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const order = await updateOrder(orderId, { status: parsed.data.status });
    return Response.json({ order });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update order";
    return Response.json({ error: message }, { status: 500 });
  }
}
