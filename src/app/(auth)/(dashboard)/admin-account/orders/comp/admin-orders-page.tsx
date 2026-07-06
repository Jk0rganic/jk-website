"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, PackageCheck, WalletCards } from "lucide-react";
import { useAccount } from "../../../(resources)/dashboard-utils/account-context";
import {
  filterOrders,
  ORDER_STATUS_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
} from "@/lib/admin/admin-stats";
import { formatDate } from "@/utils/formatDate";
import { getOrderDisplayInfo } from "@/lib/checkout/get-order-display";
import { PageHeader } from "../../components/ui/page-header";
import { AdminBadge } from "../../components/ui/admin-badge";
import { AdminEmptyState } from "../../components/ui/admin-empty-state";
import { AdminMetricCard } from "../../components/ui/admin-metric-card";
import { AdminPanel } from "../../components/ui/admin-panel";
import { AdminToolbar } from "../../components/ui/admin-toolbar";
import styles from "./styles.module.scss";

const ITEMS_PER_PAGE = 15;

type BadgeTone = "success" | "info" | "warning" | "danger" | "neutral";

function orderBadgeTone(status: string): BadgeTone {
  switch (status) {
    case "completed":
      return "success";
    case "processing":
      return "info";
    case "pending":
    case "on-hold":
      return "warning";
    case "cancelled":
    case "refunded":
      return "danger";
    default:
      return "neutral";
  }
}

function paymentBadgeTone(order: DashboardOrder): BadgeTone {
  if (order.date_paid) return "success";
  if (order.payment_method === "cod") return "info";
  return "warning";
}

function getCustomerName(order: DashboardOrder) {
  return [order.billing?.first_name, order.billing?.last_name]
    .filter(Boolean)
    .join(" ");
}

function getDeliverySummary(order: DashboardOrder) {
  const method = order.shipping_lines?.[0]?.method_title || "Delivery method";
  const location =
    [
      order.shipping?.city || order.billing?.city,
      order.shipping?.state || order.billing?.state,
    ]
      .filter(Boolean)
      .join(", ") || "Location not set";

  return { method, location };
}

export default function AdminOrdersPage() {
  const { orders } = useAccount();
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [search, setSearch] = useState("");

  const filteredOrders = useMemo(
    () =>
      filterOrders(orders, {
        status: statusFilter || undefined,
        paymentMethod: paymentFilter || undefined,
        search,
      }),
    [orders, statusFilter, paymentFilter, search],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / ITEMS_PER_PAGE),
  );

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const fulfillmentStats = useMemo(
    () => ({
      pending: filteredOrders.filter((order) => order.status === "pending")
        .length,
      processing: filteredOrders.filter(
        (order) => order.status === "processing",
      ).length,
      completed: filteredOrders.filter((order) => order.status === "completed")
        .length,
      unpaid: filteredOrders.filter((order) => !order.date_paid).length,
    }),
    [filteredOrders],
  );

  const link = "/admin-account/orders/";

  return (
    <>
      <PageHeader
        title="Fulfillment queue"
        subtitle={`${filteredOrders.length} visible of ${orders.length} loaded orders. Search, filter, and manage customer fulfillment.`}
      />

      <section className={styles.statusStrip} aria-label="Fulfillment KPIs">
        <AdminMetricCard
          label="Pending"
          value={fulfillmentStats.pending}
          icon={Clock3}
          tone="warning"
          detail="Awaiting confirmation"
        />
        <AdminMetricCard
          label="Processing"
          value={fulfillmentStats.processing}
          icon={PackageCheck}
          tone="info"
          detail="Being prepared"
        />
        <AdminMetricCard
          label="Completed"
          value={fulfillmentStats.completed}
          icon={CheckCircle2}
          tone="success"
          detail="Delivered or closed"
        />
        <AdminMetricCard
          label="Unpaid"
          value={fulfillmentStats.unpaid}
          icon={WalletCards}
          tone="danger"
          detail="No paid date"
        />
      </section>

      <AdminPanel
        title="Orders"
        description="Customer, payment, delivery, and status in one operational view."
      >
        <AdminToolbar
          searchLabel="Search orders"
          searchPlaceholder="Search order #, name, email, phone"
          searchValue={search}
          onSearchChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
        >
          <label className={styles.filterControl}>
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              {ORDER_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.filterControl}>
            <span>Payment</span>
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              {PAYMENT_METHOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </AdminToolbar>

        {!filteredOrders.length ? (
          <AdminEmptyState
            title="No orders match these filters"
            description="Adjust the search, status, or payment filters to widen the queue."
            icon={PackageCheck}
          />
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.ordersTable}>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Delivery / location</th>
                    <th>Total</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map((order) => {
                    const display = getOrderDisplayInfo(order);
                    const customerName = getCustomerName(order);
                    const delivery = getDeliverySummary(order);

                    return (
                      <tr key={order.id}>
                        <td data-label="Order">
                          <strong>#{order.id}</strong>
                          <span>{order.line_items?.length ?? 0} items</span>
                        </td>
                        <td data-label="Customer">
                          <strong>{customerName || "Guest customer"}</strong>
                          <span>{order.billing?.email || "No email"}</span>
                          <span>{order.billing?.phone || "No phone"}</span>
                        </td>
                        <td data-label="Status">
                          <AdminBadge tone={orderBadgeTone(order.status)}>
                            {display.orderLabel}
                          </AdminBadge>
                          {display.orderHint && <span>{display.orderHint}</span>}
                        </td>
                        <td data-label="Payment">
                          <AdminBadge tone={paymentBadgeTone(order)}>
                            {display.paymentLabel ||
                              order.payment_method_title ||
                              "Payment"}
                          </AdminBadge>
                          <span>{order.date_paid ? "Paid" : "Unpaid"}</span>
                        </td>
                        <td data-label="Delivery / location">
                          <strong>{delivery.location}</strong>
                          <span>{delivery.method}</span>
                        </td>
                        <td data-label="Total" className={styles.totalCell}>
                          {order.total} {order.currency}
                        </td>
                        <td data-label="Date">{formatDate(order.date_created)}</td>
                        <td data-label="Actions">
                          <Link className={styles.manageLink} href={`${link}${order.id}`}>
                            Manage
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={styles.pagination}>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </>
        )}
      </AdminPanel>
    </>
  );
}
