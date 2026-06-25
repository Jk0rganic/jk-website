"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowDown,
  ArrowUp,
  Package,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useAccount } from "../../../(resources)/dashboard-utils/account-context";
import { computeWeeklyComparison } from "@/lib/admin/admin-stats";
import { formatPrice } from "@/utils/format-price";
import { formatDate } from "@/utils/formatDate";
import { getOrderDisplayInfo } from "@/lib/checkout/get-order-display";
import OrdersChart from "../../comp/accountPage/two";
import ui from "../ui/admin-ui.module.scss";

function TrendBadge({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) {
  let percentage = 0;

  if (previous === 0 && current > 0) {
    percentage = 100;
  } else if (previous > 0) {
    percentage = ((current - previous) / previous) * 100;
  }

  const isUp = percentage >= 0;

  return (
    <span className={isUp ? ui.trendUp : ui.trendDown}>
      {isUp ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
      {Math.abs(percentage).toFixed(1)}% vs last week
    </span>
  );
}

const toneClass = {
  green: "iconGreen",
  blue: "iconBlue",
  amber: "iconAmber",
  violet: "iconViolet",
} as const;

export default function AdminDashboard() {
  const { orders, session } = useAccount();

  const { thisWeek, lastWeek } = useMemo(
    () => computeWeeklyComparison(orders),
    [orders],
  );

  const recentOrders = useMemo(() => [...orders].slice(0, 6), [orders]);

  const avgOrder =
    thisWeek.orders > 0 ? thisWeek.sales / thisWeek.orders : 0;

  const stats = [
    {
      label: "Revenue",
      value: formatPrice(thisWeek.sales),
      current: thisWeek.sales,
      previous: lastWeek.sales,
      icon: Wallet,
      tone: "green" as const,
    },
    {
      label: "Orders",
      value: String(thisWeek.orders),
      current: thisWeek.orders,
      previous: lastWeek.orders,
      icon: ShoppingBag,
      tone: "blue" as const,
    },
    {
      label: "Units sold",
      value: String(thisWeek.products),
      current: thisWeek.products,
      previous: lastWeek.products,
      icon: Package,
      tone: "amber" as const,
    },
    {
      label: "Avg. order",
      value: formatPrice(avgOrder),
      current: avgOrder,
      previous: lastWeek.orders > 0 ? lastWeek.sales / lastWeek.orders : 0,
      icon: TrendingUp,
      tone: "violet" as const,
    },
  ];

  const firstName = session.user.name?.split(" ")[0] || "there";

  return (
    <>
      <section className={ui.hero}>
        <div>
          <h2>Welcome back, {firstName}</h2>
          <p>
            Here is how JK Organics is performing this week. Jump into orders or
            add a new product in one click.
          </p>
        </div>
        <div className={ui.heroActions}>
          <Link href="/admin-account/products/new" className={ui.btnPrimary}>
            + Add product
          </Link>
          <Link href="/admin-account/orders" className={ui.btnGhost}>
            View orders
          </Link>
        </div>
      </section>

      <div className={ui.statGrid}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article key={stat.label} className={ui.statCard}>
              <div className={ui.statTop}>
                <span className={ui.statLabel}>{stat.label}</span>
                <div
                  className={`${ui.statIcon} ${ui[toneClass[stat.tone]]}`}
                >
                  <Icon size={20} />
                </div>
              </div>
              <div className={ui.statValue}>{stat.value}</div>
              <TrendBadge
                current={stat.current}
                previous={stat.previous}
              />
            </article>
          );
        })}
      </div>

      <div className={ui.dashboardGrid}>
        <section className={ui.card}>
          <div className={ui.cardHeader}>
            <h2>Sales overview</h2>
          </div>
          <div className={ui.cardBody}>
            <OrdersChart orders={orders} />
          </div>
        </section>

        <section className={ui.card}>
          <div className={ui.cardHeader}>
            <h2>Recent orders</h2>
            <Link href="/admin-account/orders">View all</Link>
          </div>
          <div className={ui.cardBody}>
            {!recentOrders.length ? (
              <p className={ui.empty}>No orders yet.</p>
            ) : (
              <div className={ui.tableWrap}>
                <table className={ui.table}>
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Status</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => {
                      const display = getOrderDisplayInfo(order);
                      return (
                        <tr key={order.id}>
                          <td>
                            <Link href={`/admin-account/orders/${order.id}`}>
                              #{order.id}
                            </Link>
                            <div className={ui.muted}>
                              {formatDate(order.date_created)}
                            </div>
                          </td>
                          <td>{display.orderLabel}</td>
                          <td>
                            {order.total} {order.currency}
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
      </div>
    </>
  );
}
