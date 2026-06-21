import prisma from "@/lib/prisma";
import {
  getPaymentStatus,
  getPaymentStatusByCheckoutId,
} from "./client";
import { syncPaymentFromInvoice } from "./sync-payment";

const MIN_AGE_MS = 2 * 60 * 1000;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const BATCH_SIZE = 50;

export interface ReconcileResultItem {
  orderId: number;
  paymentId: string;
  status: string;
  invoiceState?: string;
  error?: string;
}

export interface ReconcileSummary {
  checked: number;
  updated: number;
  results: ReconcileResultItem[];
}

export async function reconcilePendingPayments(): Promise<ReconcileSummary> {
  const now = Date.now();
  const minCreatedAt = new Date(now - MAX_AGE_MS);
  const maxCreatedAt = new Date(now - MIN_AGE_MS);

  const pendingPayments = await prisma.payment.findMany({
    where: {
      status: "PENDING",
      createdAt: {
        gte: minCreatedAt,
        lte: maxCreatedAt,
      },
    },
    orderBy: { createdAt: "asc" },
    take: BATCH_SIZE,
  });

  const results: ReconcileResultItem[] = [];
  let updated = 0;

  for (const payment of pendingPayments) {
    try {
      const statusResponse = payment.invoiceId
        ? await getPaymentStatus(payment.invoiceId)
        : await getPaymentStatusByCheckoutId(payment.checkoutId);

      const previousStatus = payment.status;
      const status = await syncPaymentFromInvoice(
        payment,
        statusResponse.invoice,
      );

      if (status !== previousStatus) {
        updated += 1;
      }

      results.push({
        orderId: payment.orderId,
        paymentId: payment.id,
        status,
        invoiceState: statusResponse.invoice.state,
      });
    } catch (error) {
      results.push({
        orderId: payment.orderId,
        paymentId: payment.id,
        status: payment.status,
        error: error instanceof Error ? error.message : "Reconciliation failed",
      });
    }
  }

  return {
    checked: pendingPayments.length,
    updated,
    results,
  };
}
