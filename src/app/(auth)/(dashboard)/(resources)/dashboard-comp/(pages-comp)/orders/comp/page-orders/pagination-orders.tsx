"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

import styles from "./styles.module.scss";
import displayStyles from "../order-display/styles.module.scss";
import { formatDate } from "@/utils/formatDate";
import { getOrderDisplayInfo } from "@/lib/checkout/get-order-display";
import {
  OrderPaymentBadge,
  OrderStatusBadge,
} from "../order-display/order-display";
import { PendingPaymentLink } from "../pending-payment/pending-payment";

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

  useMemo(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  if (!orders.length) {
    return <p>You have no orders yet.</p>;
  }

  return (
    <div className={styles.orderPage}>
      <h1>Your Orders ({orders.length})</h1>

      <table className={`${styles.ordersTable} ${styles.web}`}>
        <thead>
          <tr>
            <th>Order #</th>
            <th>Date</th>
            <th>Order status</th>
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
                <td>#{order.id}</td>
                <td>{formatDate(order.date_created)}</td>
                <td>
                  <OrderStatusBadge
                    label={display.orderLabel}
                    hint={display.orderHint}
                    tone={display.orderTone}
                  />
                </td>
                <td>
                  {display.awaitingPayment ? (
                    <PendingPaymentLink orderId={order.id} />
                  ) : (
                    <OrderPaymentBadge
                      label={display.paymentLabel}
                      tone={display.paymentTone}
                    />
                  )}
                </td>
                <td>
                  {order.total} {order.currency}
                </td>
                <td>
                  <Link href={`${link}${order.id}`}>View</Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <table className={`${styles.ordersTable} ${styles.mobile}`}>
        <thead>
          <tr>
            <th>Order</th>
            <th />
          </tr>
        </thead>

        <tbody>
          {paginatedOrders.map((order) => {
            const display = getOrderDisplayInfo(order);

            return (
              <tr key={order.id}>
                <td>
                  <strong>#{order.id}</strong> · {formatDate(order.date_created)}
                  <div className={displayStyles.mobile_meta}>
                    <OrderStatusBadge
                      label={display.orderLabel}
                      hint={display.orderHint}
                      tone={display.orderTone}
                    />
                    {display.awaitingPayment ? (
                      <PendingPaymentLink orderId={order.id} />
                    ) : (
                      <OrderPaymentBadge
                        label={display.paymentLabel}
                        tone={display.paymentTone}
                      />
                    )}
                  </div>
                </td>
                <td>
                  <Link href={`${link}${order.id}`}>View</Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

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
