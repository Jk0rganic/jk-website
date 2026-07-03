import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { startOrderPayment } from "@/lib/intasend/start-order-payment";

const retrySchema = z.object({
  orderId: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId } = retrySchema.parse(body);

    const payment = await startOrderPayment(orderId);

    return NextResponse.json(payment);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Payment retry failed";
    return NextResponse.json({ message }, { status: 400 });
  }
}
