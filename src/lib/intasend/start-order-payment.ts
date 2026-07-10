import { isOrderAwaitingPayment } from "@/lib/checkout/is-order-awaiting-payment";
import { getOrder } from "@/lib/fetch/getOrder";
import prisma from "@/lib/prisma";
import { formatPhoneInternational } from "@/utils/format-phone";
import { initiateMpesaStkPush } from "./client";

export interface StartedOrderPayment {
  checkoutId: string;
  invoiceId: string;
  orderId: number;
}

export async function startOrderPayment(
  orderId: number,
): Promise<StartedOrderPayment> {
  const order = await getOrder(orderId);

  if (!isOrderAwaitingPayment(order)) {
    throw new Error("Order is not awaiting online payment");
  }

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

  return {
    checkoutId: invoiceId,
    invoiceId,
    orderId,
  };
}
