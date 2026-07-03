"use client";

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
import ui from "../../components/ui/admin-ui.module.scss";
import { PageHeader } from "../../components/ui/page-header";

const STALE_PENDING_FILTER = "STALE_PENDING";
const STALE_PENDING_THRESHOLD_MINUTES = 30;

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

  const toneClass = {
    success: ui.badgeGreen,
    pending: ui.badgeYellow,
    danger: ui.badgeRed,
    neutral: ui.badgeGray,
  } as const;

  return (
    <>
      <PageHeader
        title="Payments"
        subtitle="Track M-Pesa payment attempts and reconcile pending checkouts."
      />

      <div className={ui.statGrid}>
        {[
          { label: "Total", value: summary.total },
          { label: "Completed", value: summary.completed },
          { label: "Pending", value: summary.pending },
          { label: "Failed", value: summary.failed },
        ].map((item) => (
          <article key={item.label} className={ui.statCard}>
            <span className={ui.statLabel}>{item.label}</span>
            <div className={ui.statValue}>{item.value}</div>
          </article>
        ))}
      </div>

      <div className={ui.statGrid}>
        {[
          {
            label: "Completed amount",
            value: formatPaymentAmount(amountSummary.completedAmount),
          },
          {
            label: "Pending amount",
            value: formatPaymentAmount(amountSummary.pendingAmount),
          },
          {
            label: "Failed amount",
            value: formatPaymentAmount(amountSummary.failedAmount),
          },
          {
            label: "Success rate",
            value: `${amountSummary.successRate.toFixed(0)}%`,
          },
        ].map((item) => (
          <article key={item.label} className={ui.statCard}>
            <span className={ui.statLabel}>{item.label}</span>
            <div className={ui.statValue}>{item.value}</div>
          </article>
        ))}
      </div>

      <section className={ui.card}>
        <div className={ui.cardBody}>
          <div className={ui.toolbar}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={ui.select}
            >
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETE">Complete</option>
              <option value="FAILED">Failed</option>
              <option value={STALE_PENDING_FILTER}>Stale pending</option>
            </select>
            <span className={ui.muted}>
              {stalePendingPayments.length} stale pending older than{" "}
              {STALE_PENDING_THRESHOLD_MINUTES} minutes
            </span>
          </div>

          {loading && <p className={ui.muted}>Loading payments…</p>}
          {error && <p className={ui.error}>{error}</p>}

          {!loading && !error && !displayedPayments.length && (
            <p className={ui.empty}>No payment records found.</p>
          )}

          {!loading && !error && displayedPayments.length > 0 && (
            <div className={ui.tableWrap}>
              <table className={ui.table}>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Amount</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Reference</th>
                    <th>Date</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {displayedPayments.map((payment) => {
                    const tone = getPaymentStatusTone(payment.status);

                    return (
                      <tr key={payment.id}>
                        <td>#{payment.orderId}</td>
                        <td>{formatPaymentAmount(payment.amount)}</td>
                        <td>{payment.phoneNumber}</td>
                        <td>
                          <span className={`${ui.badge} ${toneClass[tone]}`}>
                            {payment.status}
                          </span>
                        </td>
                        <td>{payment.transactionRef || "—"}</td>
                        <td>{formatDate(String(payment.createdAt))}</td>
                        <td>
                          <Link
                            href={`/admin-account/orders/${payment.orderId}`}
                          >
                            View order
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
