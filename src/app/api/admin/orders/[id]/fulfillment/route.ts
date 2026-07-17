import { z } from "zod";
import { requireAdminSession } from "@/lib/admin/require-admin";
import {
  FULFILLMENT_META_KEY,
  getFulfillmentStatusOptions,
} from "@/lib/checkout/fulfillment-status";
import {
  buildHistoryMetaEntry,
  FULFILLMENT_HISTORY_META_KEY,
  getAdminIdentity,
} from "@/lib/checkout/order-history";
import { getOrder } from "@/lib/fetch/getOrder";
import { updateOrder } from "@/lib/fetch/updateOrder";

const updateSchema = z.object({
  fulfillmentStatus: z.string().trim().min(1),
});

function parseOrderId(id: string) {
  const orderId = Number(id);
  return Number.isFinite(orderId) && orderId > 0 ? orderId : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error, status, session } = await requireAdminSession();

  if (error || !session) {
    return Response.json({ error }, { status });
  }

  const { id } = await params;
  const orderId = parseOrderId(id);

  if (!orderId) {
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
      { error: "Invalid fulfillment status", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const currentOrder = await getOrder(orderId);
    const validValues: string[] = getFulfillmentStatusOptions(currentOrder).map(
      (stage) => stage.value,
    );

    if (!validValues.includes(parsed.data.fulfillmentStatus)) {
      return Response.json(
        {
          error: "Fulfillment status does not match this order's delivery type",
        },
        { status: 400 },
      );
    }

    const historyEntry = buildHistoryMetaEntry(
      currentOrder.meta_data,
      FULFILLMENT_HISTORY_META_KEY,
      {
        value: parsed.data.fulfillmentStatus,
        by: getAdminIdentity(session.user),
        at: new Date().toISOString(),
      },
    );

    const order = await updateOrder(orderId, {
      meta_data: [
        { key: FULFILLMENT_META_KEY, value: parsed.data.fulfillmentStatus },
        historyEntry,
      ],
    });

    return Response.json({ order });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Failed to update fulfillment status";
    return Response.json({ error: message }, { status: 500 });
  }
}
