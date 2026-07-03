import { z } from "zod";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { createOrderNote, fetchOrderNotes } from "@/lib/fetch/orderNotes";

const noteSchema = z.object({
  note: z.string().trim().min(1),
  customerNote: z.boolean().optional(),
});

function parseOrderId(id: string) {
  const orderId = Number(id);
  return Number.isFinite(orderId) && orderId > 0 ? orderId : null;
}

export async function GET(
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
    const notes = await fetchOrderNotes(orderId);
    return Response.json({ notes });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch order notes";
    return Response.json({ error: message }, { status: 500 });
  }
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

  const parsed = noteSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid note", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const note = await createOrderNote(orderId, parsed.data);
    return Response.json({ note }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create order note";
    return Response.json({ error: message }, { status: 500 });
  }
}
