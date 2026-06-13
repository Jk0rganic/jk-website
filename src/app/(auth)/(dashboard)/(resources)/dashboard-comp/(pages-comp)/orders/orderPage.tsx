"use client";

import { useAccount } from "../../../dashboard-utils/account-context";
import PaginationOrders from "./comp/page-orders/pagination-orders";

export default function OrdersPage({ link = "/account/orders/" }) {
  const { orders } = useAccount();

  return <PaginationOrders link={link} orders={orders} />;
}
