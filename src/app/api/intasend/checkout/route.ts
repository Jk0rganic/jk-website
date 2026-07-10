import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { initiateMpesaStkPush } from "@/lib/intasend/client";
import prisma from "@/lib/prisma";
import { formatPhoneInternational } from "@/utils/format-phone";

const checkoutSchema = z.object({
  orderId: z.number().int().positive(),
  amount: z.number().positive(),
  phone: z.string().min(9),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, amount, phone } = checkoutSchema.parse(body);

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
      error instanceof Error
        ? error.message
        : "M-Pesa payment initiation failed";
    return NextResponse.json({ message }, { status: 400 });
  }
}
