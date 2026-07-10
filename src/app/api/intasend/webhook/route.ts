import { type NextRequest, NextResponse } from "next/server";
import { getIntaSendConfig } from "@/lib/intasend/config";
import { syncPaymentFromInvoice } from "@/lib/intasend/sync-payment";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      challenge,
      invoice_id,
      state,
      provider,
      api_ref,
      mpesa_reference,
      failed_reason,
    } = body;

    const { webhookChallenge } = getIntaSendConfig();

    if (webhookChallenge && challenge !== webhookChallenge) {
      return NextResponse.json(
        { message: "Invalid challenge" },
        { status: 401 },
      );
    }

    const orderIdMatch = api_ref?.match(/^ORD-(\d+)$/);
    const orderId = orderIdMatch ? Number(orderIdMatch[1]) : null;

    let payment = invoice_id
      ? await prisma.payment.findFirst({ where: { invoiceId: invoice_id } })
      : null;

    if (!payment && orderId) {
      payment = await prisma.payment.findFirst({
        where: { orderId },
        orderBy: { createdAt: "desc" },
      });
    }

    if (!payment) {
      return NextResponse.json({ received: true });
    }

    await syncPaymentFromInvoice(payment, {
      invoice_id: invoice_id ?? payment.invoiceId ?? "",
      state,
      provider,
      mpesa_reference,
      failed_reason,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("IntaSend webhook error:", error);
    return NextResponse.json({ received: true });
  }
}
