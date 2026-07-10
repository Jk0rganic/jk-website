"use client";

import { ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  computeOrderStatusSummary,
  computeTopCustomers,
  computeTopLocations,
  computeWeeklyComparison,
  filterOrders,
  ORDER_STATUS_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
} from "@/lib/admin/admin-stats";
import { getOrderDisplayInfo } from "@/lib/checkout/get-order-display";
import { formatPrice } from "@/utils/format-price";
import { formatDate } from "@/utils/formatDate";
import {
  OrderPaymentBadge,
  OrderStatusBadge,
} from "../../../(resources)/dashboard-comp/(pages-comp)/orders/comp/order-display/order-display";
import { useAccount } from "../../../(resources)/dashboard-utils/account-context";
import ui from "../../components/ui/admin-ui.module.scss";
import { PageHeader } from "../../components/ui/page-header";

const ITEMS_PER_PAGE = 15;
const TOP_LOCATIONS_LIMIT = 3;
const TOP_CUSTOMERS_LIMIT = 3;
const rankClasses = [
  "rankGreen",
  "rankBlue",
  "rankAmber",
] as const satisfies Array<keyof typeof ui>;

function getInitials(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "?";
}

export default function AdminOrdersPage() {
  const { orders } = useAccount();
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showInsights, setShowInsights] = useState(true);

  const statusSummary = useMemo(
    () => computeOrderStatusSummary(orders),
    [orders],
  );
  const weeklyRevenue = useMemo(
    () => computeWeeklyComparison(orders).thisWeek.sales,
    [orders],
  );
  const topLocations = useMemo(
    () => computeTopLocations(orders, TOP_LOCATIONS_LIMIT),
    [orders],
  );
  const topCustomers = useMemo(
    () => computeTopCustomers(orders, TOP_CUSTOMERS_LIMIT),
    [orders],
  );

  const stats = [
    { label: "Total orders", value: String(orders.length) },
    {
      label: "Awaiting fulfilment",
      value: String(
        statusSummary.pending + statusSummary.processing + statusSummary.onHold,
      ),
    },
    { label: "Completed", value: String(statusSummary.completed) },
    { label: "Revenue (wk)", value: formatPrice(weeklyRevenue) },
  ];

  const maxLocationOrders = topLocations[0]?.orders ?? 0;

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

  const link = "/admin-account/orders/";

  return (
    <>
      <PageHeader title="Orders" subtitle="Track and fulfill customer orders" />

      <div className={ui.statGrid}>
        {stats.map((stat) => (
          <article key={stat.label} className={ui.statCard}>
            <span className={ui.statLabel}>{stat.label}</span>
            <div className={ui.statValue}>{stat.value}</div>
          </article>
        ))}
      </div>

      <section className={`${ui.card} ${ui.insightsCard}`}>
        <div className={ui.insightsHeader}>
          <h2>
            <TrendingUp size={16} />
            Store insights
            <span>· top locations &amp; customers</span>
          </h2>
          <button
            type="button"
            className={ui.insightsToggle}
            onClick={() => setShowInsights((value) => !value)}
          >
            {showInsights ? "Hide" : "Show"}
            {showInsights ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </section>

      {showInsights ? (
        <div className={ui.insightsGrid}>
          <section className={ui.card}>
            <div className={ui.cardHeader}>
              <h2>Top delivery locations</h2>
              <span className={ui.statNote}>by orders</span>
            </div>
            <div className={ui.cardBody}>
              {!topLocations.length ? (
                <p className={ui.empty}>No orders yet.</p>
              ) : (
                <div className={ui.mixList}>
                  {topLocations.map((location) => {
                    const pct = maxLocationOrders
                      ? Math.round((location.orders / maxLocationOrders) * 100)
                      : 0;

                    return (
                      <div key={location.location} className={ui.mixRow}>
                        <div>
                          <span>{location.location}</span>
                          <strong>
                            {location.orders} · {formatPrice(location.revenue)}
                          </strong>
                        </div>
                        <div className={ui.progressTrack}>
                          <span style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section className={ui.card}>
            <div className={ui.cardHeader}>
              <h2>Top customers</h2>
              <span className={ui.statNote}>by spend</span>
            </div>
            <div className={ui.cardBody}>
              {!topCustomers.length ? (
                <p className={ui.empty}>No orders yet.</p>
              ) : (
                <div className={ui.customerList}>
                  {topCustomers.map((customer, index) => (
                    <div key={customer.key} className={ui.customerRow}>
                      <span
                        className={`${ui.customerRank} ${ui[rankClasses[index % rankClasses.length]]}`}
                      >
                        {index + 1}
                      </span>
                      <span className={ui.avatarCircle}>
                        {getInitials(customer.name)}
                      </span>
                      <div className={ui.customerInfo}>
                        <strong>{customer.name}</strong>
                        <span>{customer.location}</span>
                      </div>
                      <div className={ui.customerAmount}>
                        <strong>{formatPrice(customer.revenue)}</strong>
                        <span>{customer.orders} orders</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      ) : null}

      <section className={ui.card}>
        <div className={ui.cardBody}>
          <div className={ui.toolbar}>
            <input
              type="search"
              placeholder="Search order #, name, email, phone…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className={ui.searchInput}
            />

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={ui.select}
            >
              {ORDER_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={ui.select}
            >
              {PAYMENT_METHOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {!filteredOrders.length ? (
            <p className={ui.empty}>No orders match your filters.</p>
          ) : (
            <>
              <div className={ui.tableWrap}>
                <table className={ui.table}>
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th>Total</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedOrders.map((order) => {
                      const display = getOrderDisplayInfo(order);

                      return (
                        <tr key={order.id}>
                          <td>
                            <strong>#{order.id}</strong>
                          </td>
                          <td>
                            {order.billing?.first_name}{" "}
                            {order.billing?.last_name}
                            <div className={ui.muted}>
                              {order.billing?.email}
                            </div>
                          </td>
                          <td>{formatDate(order.date_created)}</td>
                          <td>
                            <OrderStatusBadge
                              label={display.orderLabel}
                              hint={display.orderHint}
                              tone={display.orderTone}
                            />
                          </td>
                          <td>
                            <OrderPaymentBadge
                              label={display.paymentLabel}
                              tone={display.paymentTone}
                            />
                          </td>
                          <td>
                            {order.total} {order.currency}
                          </td>
                          <td>
                            <Link href={`${link}${order.id}`}>Manage</Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className={ui.pagination}>
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
        </div>
      </section>
    </>
  );
}
