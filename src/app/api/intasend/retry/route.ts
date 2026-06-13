import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createCheckout } from "@/lib/intasend/client";
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

    if (!amount || Number.isNaN(amount)) {
      throw new Error("Invalid order amount");
    }

    const checkout = await createCheckout({
      orderId,
      amount,
      firstName: order.billing?.first_name ?? "Customer",
      lastName: order.billing?.last_name ?? "",
      email: order.billing?.email ?? "",
      phone: formatPhoneInternational(order.billing?.phone ?? ""),
    });

    await prisma.payment.create({
      data: {
        checkoutId: checkout.id,
        orderId,
        amount: Math.round(amount),
        phoneNumber: order.billing?.phone ?? "",
        status: "PENDING",
      },
    });

    return NextResponse.json({
      checkoutId: checkout.id,
      checkoutUrl: checkout.url,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Payment retry failed";
    return NextResponse.json({ message }, { status: 400 });
  }
}
