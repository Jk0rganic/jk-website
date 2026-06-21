import { mapIntaSendState } from "@/lib/intasend/types";
import { updateOrder } from "@/lib/fetch/updateOrder";
import prisma from "@/lib/prisma";

function resolveFailureReason(
  state: Parameters<typeof mapIntaSendState>[0],
  failedReason?: string | null,
) {
  if (failedReason?.trim()) return failedReason.trim();
  if (state === "CANCELED") return "Request cancelled by user";
  return null;
}

function getTransactionRef(invoice: {
  mpesa_reference?: string;
  invoice_id?: string;
}) {
  return invoice.mpesa_reference || invoice.invoice_id || null;
}

export async function syncPaymentFromInvoice(
  payment: {
    id: string;
    checkoutId: string;
    orderId: number;
    status: string;
  },
  invoice: {
    invoice_id: string;
    state: Parameters<typeof mapIntaSendState>[0];
    provider?: string;
    mpesa_reference?: string;
    failed_reason?: string | null;
  },
) {
  const status = mapIntaSendState(invoice.state);
  const transactionRef = getTransactionRef(invoice);
  const failureReason = resolveFailureReason(
    invoice.state,
    invoice.failed_reason,
  );

  if (payment.status === status && status !== "SUCCESS") {
    return status;
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status,
      invoiceId: invoice.invoice_id,
      provider: invoice.provider ?? null,
      transactionRef,
      failureReason: failureReason ?? null,
    },
  });

  if (status === "SUCCESS" && payment.status !== "SUCCESS") {
    await updateOrder(payment.orderId, {
      status: "processing",
      set_paid: true,
      transaction_id: transactionRef ?? invoice.invoice_id,
      meta_data: [
        { key: "_intasend_invoice", value: invoice.invoice_id },
        { key: "_intasend_provider", value: invoice.provider ?? "unknown" },
        ...(transactionRef
          ? [{ key: "_payment_reference", value: transactionRef }]
          : []),
      ],
    });
  }

  return status;
}
