import { z } from "zod";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { isOrderAwaitingPayment } from "@/lib/checkout/is-order-awaiting-payment";
import { getOrder } from "@/lib/fetch/getOrder";
import { updateOrder } from "@/lib/fetch/updateOrder";
import { notifyStaffOfNewOrder } from "@/lib/notifications/notify-new-order";

const markPaidSchema = z.object({
  transactionRef: z.string().trim().min(1),
  note: z.string().trim().optional(),
});

function parseOrderId(id: string) {
  const orderId = Number(id);
  return Number.isFinite(orderId) && orderId > 0 ? orderId : null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error, status } = await requireAdminSession();

  if (error) {
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

  const parsed = markPaidSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      {
        error: "Invalid transaction reference",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const metaData = [
    { key: "_jk_manual_payment_ref", value: parsed.data.transactionRef },
  ];

  if (parsed.data.note) {
    metaData.push({
      key: "_jk_manual_payment_note",
      value: parsed.data.note,
    });
  }

  try {
    const currentOrder = await getOrder(orderId);

    if (!isOrderAwaitingPayment(currentOrder)) {
      return Response.json(
        { error: "Order is not awaiting online payment" },
        { status: 409 },
      );
    }

    const order = await updateOrder(orderId, {
      status: "processing",
      set_paid: true,
      transaction_id: parsed.data.transactionRef,
      meta_data: metaData,
    });

    await notifyStaffOfNewOrder(order as WooOrderResponse);

    return Response.json({ order });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to mark order paid";
    return Response.json({ error: message }, { status: 500 });
  }
}
