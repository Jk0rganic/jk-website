import { requireAdminSession } from "@/lib/admin/require-admin";
import { startOrderPayment } from "@/lib/intasend/start-order-payment";

function parseOrderId(id: string) {
  const orderId = Number(id);
  return Number.isFinite(orderId) && orderId > 0 ? orderId : null;
}

export async function POST(
  _request: Request,
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

  try {
    const payment = await startOrderPayment(orderId);
    return Response.json(payment);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to send payment prompt";
    return Response.json({ error: message }, { status: 400 });
  }
}
