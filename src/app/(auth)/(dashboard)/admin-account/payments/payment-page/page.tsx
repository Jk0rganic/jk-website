"use client";

import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clock3,
  Smartphone,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  formatPaymentAmount,
  getPaymentStatusTone,
  getStalePendingPayments,
  type PaymentRecord,
  summarizePaymentAmounts,
  summarizePayments,
} from "@/lib/admin/payment-records";
import { formatDate } from "@/utils/formatDate";
import { AdminBadge } from "../../components/ui/admin-badge";
import { AdminEmptyState } from "../../components/ui/admin-empty-state";
import { AdminMetricCard } from "../../components/ui/admin-metric-card";
import { AdminPanel } from "../../components/ui/admin-panel";
import { PageHeader } from "../../components/ui/page-header";
import styles from "./styles.module.scss";

const STALE_PENDING_FILTER = "STALE_PENDING";
const STALE_PENDING_THRESHOLD_MINUTES = 30;

type BadgeTone = "success" | "info" | "warning" | "danger" | "neutral";

function paymentBadgeTone(status: string): BadgeTone {
  const tone = getPaymentStatusTone(status);

  if (tone === "success") return "success";
  if (tone === "danger") return "danger";
  if (tone === "pending") return "warning";
  return "neutral";
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    async function loadPayments() {
      setLoading(true);
      setError(null);

      try {
        const params =
          statusFilter && statusFilter !== STALE_PENDING_FILTER
            ? `?status=${statusFilter}`
            : "";
        const res = await fetch(`/api/admin/payments${params}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load payments");
        }

        setPayments(data.payments);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load payments",
        );
      } finally {
        setLoading(false);
      }
    }

    loadPayments();
  }, [statusFilter]);

  const summary = useMemo(() => summarizePayments(payments), [payments]);
  const amountSummary = useMemo(
    () => summarizePaymentAmounts(payments),
    [payments],
  );
  const stalePendingPayments = useMemo(
    () =>
      getStalePendingPayments(
        payments,
        new Date(),
        STALE_PENDING_THRESHOLD_MINUTES,
      ),
    [payments],
  );
  const displayedPayments =
    statusFilter === STALE_PENDING_FILTER ? stalePendingPayments : payments;
  const mpesaTotal = useMemo(
    () => payments.reduce((sum, payment) => sum + payment.amount, 0),
    [payments],
  );

  return (
    <>
      <PageHeader
        title="Payment reconciliation"
        subtitle="Track M-Pesa and IntaSend records, stale pending attempts, and order links."
      />

      <section className={styles.metricGrid} aria-label="Payment KPIs">
        <AdminMetricCard
          label="Collected"
          value={formatPaymentAmount(amountSummary.completedAmount)}
          icon={CheckCircle2}
          tone="success"
          detail={`${summary.completed} completed records`}
        />
        <AdminMetricCard
          label="Pending"
          value={formatPaymentAmount(amountSummary.pendingAmount)}
          icon={Clock3}
          tone="warning"
          detail={`${summary.pending} pending records`}
        />
        <AdminMetricCard
          label="Failed"
          value={formatPaymentAmount(amountSummary.failedAmount)}
          icon={AlertTriangle}
          tone="danger"
          detail={`${summary.failed} failed records`}
        />
        <AdminMetricCard
          label="Cash total"
          value={formatPaymentAmount(0)}
          icon={Banknote}
          tone="neutral"
          detail="No cash records in this feed"
        />
        <AdminMetricCard
          label="M-Pesa / IntaSend"
          value={formatPaymentAmount(mpesaTotal)}
          icon={Smartphone}
          tone="info"
          detail={`${summary.total} payment records`}
        />
      </section>

      <AdminPanel
        title="Reconciliation table"
        description={`${displayedPayments.length} visible records. Success rate ${amountSummary.successRate.toFixed(
          0,
        )}%.`}
        action={
          <label className={styles.filterControl}>
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETE">Complete</option>
              <option value="FAILED">Failed</option>
              <option value={STALE_PENDING_FILTER}>Stale pending</option>
            </select>
          </label>
        }
      >
        <div className={styles.reconciliationNote}>
          <span>
            {stalePendingPayments.length} stale pending older than{" "}
            {STALE_PENDING_THRESHOLD_MINUTES} minutes
          </span>
        </div>

        {loading && <p className={styles.muted}>Loading payments…</p>}
        {error && <p className={styles.error}>{error}</p>}

        {!loading && !error && !displayedPayments.length && (
          <AdminEmptyState
            title="No payment records found"
            description="Payment attempts will appear here after checkout activity."
            icon={Smartphone}
          />
        )}

        {!loading && !error && displayedPayments.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={styles.paymentsTable}>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Channel</th>
                  <th>Phone</th>
                  <th>Reference</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td data-label="Order">
                      <strong>#{payment.orderId}</strong>
                      <span>{payment.checkoutId}</span>
                    </td>
                    <td data-label="Status">
                      <AdminBadge tone={paymentBadgeTone(payment.status)}>
                        {payment.status}
                      </AdminBadge>
                    </td>
                    <td data-label="Amount" className={styles.amountCell}>
                      {formatPaymentAmount(payment.amount)}
                    </td>
                    <td data-label="Channel">
                      <strong>{payment.provider || "IntaSend"}</strong>
                      <span>M-Pesa payment record</span>
                    </td>
                    <td data-label="Phone">{payment.phoneNumber}</td>
                    <td data-label="Reference">
                      {payment.transactionRef || "No reference"}
                      {payment.failureReason && (
                        <span>{payment.failureReason}</span>
                      )}
                    </td>
                    <td data-label="Date">
                      {formatDate(String(payment.createdAt))}
                    </td>
                    <td data-label="Actions">
                      <Link
                        className={styles.orderLink}
                        href={`/admin-account/orders/${payment.orderId}`}
                      >
                        View order
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>
    </>
  );
}
