import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { initiateMpesaStkPush } from "@/lib/intasend/client";
import { getOrder } from "@/lib/fetch/getOrder";
import { formatPhoneInternational } from "@/utils/format-phone";
import prisma from "@/lib/prisma";

const retrySchema = z.object({
  orderId: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId } = retrySchema.parse(body);

    const order = await getOrder(orderId);
    const amount = Number(order.total);
    const phone = order.billing?.phone ?? "";

    if (!amount || Number.isNaN(amount)) {
      throw new Error("Invalid order amount");
    }

    if (!phone.trim()) {
      throw new Error("Order is missing a billing phone number");
    }

    const stkPush = await initiateMpesaStkPush({
      orderId,
      amount,
      phone: formatPhoneInternational(phone),
    });

    const invoiceId = stkPush.invoice.invoice_id;

    await prisma.payment.create({
      data: {
        checkoutId: invoiceId,
        invoiceId,
        orderId,
        amount: Math.round(amount),
        phoneNumber: phone,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      checkoutId: invoiceId,
      invoiceId,
      orderId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Payment retry failed";
    return NextResponse.json({ message }, { status: 400 });
  }
}
