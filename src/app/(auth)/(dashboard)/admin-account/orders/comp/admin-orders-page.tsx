"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAccount } from "../../../(resources)/dashboard-utils/account-context";
import {
  filterOrders,
  ORDER_STATUS_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
} from "@/lib/admin/admin-stats";
import { formatDate } from "@/utils/formatDate";
import { getOrderDisplayInfo } from "@/lib/checkout/get-order-display";
import {
  OrderPaymentBadge,
  OrderStatusBadge,
} from "../../../(resources)/dashboard-comp/(pages-comp)/orders/comp/order-display/order-display";
import { PageHeader } from "../../components/ui/page-header";
import ui from "../../components/ui/admin-ui.module.scss";

const ITEMS_PER_PAGE = 15;

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

  const link = "/admin-account/orders/";

  return (
    <>
      <PageHeader
        title={`${filteredOrders.length} orders`}
        subtitle="Search, filter, and manage customer orders from one place."
      />

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
                            {order.billing?.first_name} {order.billing?.last_name}
                            <div className={ui.muted}>{order.billing?.email}</div>
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
