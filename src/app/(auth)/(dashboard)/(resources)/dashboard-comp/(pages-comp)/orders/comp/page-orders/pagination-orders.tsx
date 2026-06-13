"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

import styles from "./styles.module.scss";
import OrderStatus from "../../../../orderStatus";
import { formatDate } from "@/utils/formatDate";

const ITEMS_PER_PAGE = 10;

interface PaginationOrdersProps {
  orders: DashboardOrder[];
  link?: string;
}

export default function PaginationOrders({
  orders = [],
  link = "/account/orders/",
}: PaginationOrdersProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(orders.length / ITEMS_PER_PAGE));
  }, [orders.length]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return orders.slice(start, end);
  }, [orders, currentPage]);

  // reset page if orders change (important edge case fix)
  useMemo(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages]);

  if (!orders.length) {
    return <p>You have no orders yet.</p>;
  }

  return (
    <div className={styles.orderPage}>
      <h1>Your Orders ({orders.length})</h1>

      {/* DESKTOP TABLE */}
      <table className={`${styles.ordersTable} ${styles.web}`}>
        <thead>
          <tr>
            <th>Order #</th>
            <th>Date</th>
            <th>Status</th>
            <th>Total</th>
            <th>View</th>
          </tr>
        </thead>

        <tbody>
          {paginatedOrders.map((order) => (
            <tr key={order.id}>
              <td>#{order.id}</td>
              <td>{formatDate(order.date_created)}</td>
              <td>
                <OrderStatus status={order.status} />
              </td>
              <td>
                {order.total} {order.currency}
              </td>
              <td>
                <Link href={`${link}${order.id}`}>View</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* MOBILE TABLE */}
      <table className={`${styles.ordersTable} ${styles.mobile}`}>
        <thead>
          <tr>
            <th>Order #</th>
            <th>View</th>
          </tr>
        </thead>

        <tbody>
          {paginatedOrders.map((order) => (
            <tr key={order.id}>
              <td>
                #{order.id} — {formatDate(order.date_created)}
              </td>
              <td>
                <Link href={`${link}${order.id}`}>View</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* PAGINATION */}
      <div className={styles.pagination}>
        <button
          type="button"
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
        >
          Prev
        </button>

        <span>
          Page {currentPage} of {totalPages}
        </span>

        <button
          type="button"
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
