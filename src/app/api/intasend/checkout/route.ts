import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createCheckout } from "@/lib/intasend/client";
import { formatPhoneInternational } from "@/utils/format-phone";
import prisma from "@/lib/prisma";

const checkoutSchema = z.object({
  orderId: z.number().int().positive(),
  amount: z.number().positive(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(9),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, amount, firstName, lastName, email, phone } =
      checkoutSchema.parse(body);

    const checkout = await createCheckout({
      orderId,
      amount,
      firstName,
      lastName,
      email,
      phone: formatPhoneInternational(phone),
    });

    await prisma.payment.create({
      data: {
        checkoutId: checkout.id,
        orderId,
        amount: Math.round(amount),
        phoneNumber: phone,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      checkoutId: checkout.id,
      checkoutUrl: checkout.url,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Checkout creation failed";
    return NextResponse.json({ message }, { status: 400 });
  }
}
