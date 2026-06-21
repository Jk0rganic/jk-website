import { NextRequest, NextResponse } from "next/server";
import {
  getPaymentStatus,
  getPaymentStatusByCheckoutId,
} from "@/lib/intasend/client";
import { syncPaymentFromInvoice } from "@/lib/intasend/sync-payment";
import { getPaymentFailureDetails } from "@/lib/intasend/get-payment-failure-message";
import prisma from "@/lib/prisma";

function getTransactionRef(invoice: {
  mpesa_reference?: string;
  invoice_id?: string;
}) {
  return invoice.mpesa_reference || invoice.invoice_id || null;
}

function buildFailurePayload(
  failureReason: string | null | undefined,
  invoiceState?: string | null,
) {
  const { message, kind } = getPaymentFailureDetails(
    failureReason,
    invoiceState as Parameters<typeof getPaymentFailureDetails>[1],
  );

  return {
    failureReason: failureReason ?? null,
    failureMessage: message,
    failureKind: kind,
  };
}

export async function GET(req: NextRequest) {
  try {
    const checkoutId = req.nextUrl.searchParams.get("checkoutId");
    const orderIdParam = req.nextUrl.searchParams.get("orderId");

    let payment = checkoutId
      ? await prisma.payment.findUnique({ where: { checkoutId } })
      : orderIdParam
        ? await prisma.payment.findFirst({
            where: { orderId: Number(orderIdParam) },
            orderBy: { createdAt: "desc" },
          })
        : null;

    if (!payment) {
      return NextResponse.json(
        { message: "Payment session not found" },
        { status: 404 },
      );
    }

    if (payment.status === "SUCCESS" || payment.status === "FAILED") {
      return NextResponse.json({
        status: payment.status,
        orderId: payment.orderId,
        checkoutId: payment.checkoutId,
        invoiceId: payment.invoiceId,
        transactionRef: payment.transactionRef,
        provider: payment.provider,
        ...buildFailurePayload(payment.failureReason),
        amount: payment.amount,
        phoneNumber: payment.phoneNumber,
      });
    }

    const statusResponse = payment.invoiceId
      ? await getPaymentStatus(payment.invoiceId)
      : await getPaymentStatusByCheckoutId(payment.checkoutId);

    const status = await syncPaymentFromInvoice(
      payment,
      statusResponse.invoice,
    );

    return NextResponse.json({
      status,
      orderId: payment.orderId,
      checkoutId: payment.checkoutId,
      invoiceId: statusResponse.invoice.invoice_id,
      transactionRef: getTransactionRef(statusResponse.invoice),
      provider: statusResponse.invoice.provider ?? null,
      ...buildFailurePayload(
        statusResponse.invoice.failed_reason,
        statusResponse.invoice.state,
      ),
      amount: payment.amount,
      phoneNumber: payment.phoneNumber,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Status check failed";
    return NextResponse.json({ message }, { status: 400 });
  }
}
