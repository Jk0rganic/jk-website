"use client";

import {
  AlertTriangle,
  Boxes,
  Package,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import {
  computePaymentMethodSummary,
  computeTopProducts,
} from "@/lib/admin/admin-stats";
import { getOrderDisplayInfo } from "@/lib/checkout/get-order-display";
import { formatPrice } from "@/utils/format-price";
import { formatDate } from "@/utils/formatDate";
import { useAccount } from "../../../(resources)/dashboard-utils/account-context";
import OrdersChart from "../../comp/accountPage/two";
import ui from "../ui/admin-ui.module.scss";

const toneClass = {
  green: "iconGreen",
  blue: "iconBlue",
  amber: "iconAmber",
  violet: "iconViolet",
} as const;

const lowStockFallback = [
  { name: "Raw Shea Butter", sku: "SHEA-RAW-250", quantity: 4 },
  { name: "Moringa Oil", sku: "MOR-100", quantity: 6 },
  { name: "Aloe Vera Gel", sku: "ALOE-250", quantity: 8 },
];

const productImageColors = ["#e8f5ec", "#eef6ff", "#fff7ed", "#f5f3ff"];

function getCustomerName(order: DashboardOrder) {
  const name = [order.billing?.first_name, order.billing?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || order.billing?.email || "Guest customer";
}

function getBadgeClass(
  tone: ReturnType<typeof getOrderDisplayInfo>["orderTone"],
) {
  if (tone === "success") return ui.badgeGreen;
  if (tone === "danger" || tone === "action") return ui.badgeRed;
  if (tone === "progress") return ui.badgeYellow;
  return ui.badgeGray;
}

function getPaymentBadgeClass(
  tone: ReturnType<typeof getOrderDisplayInfo>["paymentTone"],
) {
  if (tone === "paid") return ui.badgeGreen;
  if (tone === "due") return ui.badgeRed;
  if (tone === "on-delivery") return ui.badgeYellow;
  return ui.badgeGray;
}

export default function AdminDashboard() {
  const { orders, session } = useAccount();

  const paymentMix = useMemo(
    () => computePaymentMethodSummary(orders),
    [orders],
  );
  const topProducts = useMemo(() => computeTopProducts(orders, 5), [orders]);
  const recentOrders = useMemo(() => [...orders].slice(0, 6), [orders]);

  const totalOrders = orders.length;
  const totalRevenue = useMemo(
    () => orders.reduce((sum, order) => sum + Number(order.total || 0), 0),
    [orders],
  );
  const totalSales = useMemo(
    () =>
      orders.reduce(
        (sum, order) =>
          sum +
          (order.line_items ?? []).reduce(
            (quantity, item) => quantity + (item.quantity || 0),
            0,
          ),
        0,
      ),
    [orders],
  );
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const monthlyGoal = 120000;
  const currentMonthSales = useMemo(() => {
    const now = new Date();
    return orders
      .filter((order) => {
        const date = new Date(order.date_created);
        return (
          date.getFullYear() === now.getFullYear() &&
          date.getMonth() === now.getMonth()
        );
      })
      .reduce((sum, order) => sum + Number(order.total || 0), 0);
  }, [orders]);
  const goalPct = Math.min(
    Math.round((currentMonthSales / monthlyGoal) * 100),
    100,
  );

  const paymentRows = [
    {
      label: "M-Pesa (IntaSend)",
      value: paymentMix.intasend,
      color: "#249346",
    },
    { label: "Cash on delivery", value: paymentMix.cod, color: "#d97706" },
    { label: "Other", value: paymentMix.other, color: "#64748b" },
  ];

  const activity = recentOrders.slice(0, 5).map((order) => {
    const display = getOrderDisplayInfo(order);
    return {
      id: order.id,
      text: `Order #${order.id} is ${display.orderLabel.toLowerCase()}`,
      detail: `${getCustomerName(order)} · ${display.paymentLabel}`,
      date: order.date_created,
      tone: display.orderTone,
    };
  });

  const stats = [
    {
      label: "Total revenue",
      value: formatPrice(totalRevenue),
      note: "Across all orders",
      icon: Wallet,
      tone: "green" as const,
    },
    {
      label: "Total orders",
      value: String(totalOrders),
      note: "All submitted orders",
      icon: ShoppingBag,
      tone: "blue" as const,
    },
    {
      label: "Total sales",
      value: `${totalSales} units`,
      note: "Items sold",
      icon: Package,
      tone: "amber" as const,
    },
    {
      label: "Avg. order",
      value: formatPrice(avgOrder),
      note: "Revenue per order",
      icon: TrendingUp,
      tone: "violet" as const,
    },
  ];

  const firstName = session.user.name?.split(" ")[0] || "there";

  return (
    <>
      <div className={ui.priorityGrid}>
        <section className={ui.heroPanel}>
          <div className={ui.heroCopy}>
            <h2>Welcome back, {firstName}</h2>
            <p>
              Here is how JK Organics is performing this week. Revenue is
              tracked against a monthly operating goal and live order activity.
            </p>
            <div className={ui.heroActions}>
              <Link href="/admin-account/products/new" className={ui.btnAccent}>
                + Add product
              </Link>
              <Link href="/admin-account/orders" className={ui.btnOutline}>
                View orders
              </Link>
              <Link href="/admin-account/coupons" className={ui.btnOutline}>
                New coupon
              </Link>
            </div>
          </div>
          <div className={ui.goalCard}>
            <div className={ui.goalTop}>
              <span>Monthly revenue goal</span>
              <strong>{goalPct}%</strong>
            </div>
            <div className={ui.goalValue}>{formatPrice(currentMonthSales)}</div>
            <p>of {formatPrice(monthlyGoal)} target</p>
            <div className={ui.progressTrack}>
              <span style={{ width: `${goalPct}%` }} />
            </div>
          </div>
        </section>

        <section className={ui.alertCard} aria-live="polite">
          <div className={ui.alertHeader}>
            <div>
              <span>
                <AlertTriangle size={18} />
              </span>
              <h2>Low stock alerts</h2>
              <strong>{lowStockFallback.length}</strong>
            </div>
            <Link href="/admin-account/products">Restock now</Link>
          </div>
          <div className={ui.alertList}>
            {lowStockFallback.map((item) => (
              <div key={item.sku} className={ui.alertRow}>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.sku}</span>
                </div>
                <span>{item.quantity} left</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className={ui.statGrid}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article key={stat.label} className={ui.statCard}>
              <div className={ui.statTop}>
                <span className={ui.statLabel}>{stat.label}</span>
                <div className={`${ui.statIcon} ${ui[toneClass[stat.tone]]}`}>
                  <Icon size={20} />
                </div>
              </div>
              <div className={ui.statValue}>{stat.value}</div>
              <div className={ui.statFooter}>
                <span className={ui.statNote}>{stat.note}</span>
                <span className={ui.sparkLine} aria-hidden="true" />
              </div>
            </article>
          );
        })}
      </div>

      <div className={ui.analyticsGrid}>
        <section className={ui.card}>
          <div className={ui.cardHeader}>
            <div>
              <h2>Sales overview</h2>
              <p>Revenue and orders by month</p>
            </div>
          </div>
          <div className={ui.chartBody}>
            <OrdersChart orders={orders} />
          </div>
        </section>

        <section className={ui.card}>
          <div className={ui.cardHeader}>
            <h2>Top products</h2>
          </div>
          <div className={ui.cardBody}>
            {!topProducts.length ? (
              <p className={ui.empty}>No product sales yet.</p>
            ) : (
              <div className={ui.productList}>
                {topProducts.map((product, index) => (
                  <div key={product.name} className={ui.productRow}>
                    {product.image?.src ? (
                      <Image
                        alt={product.image.alt || product.name}
                        className={ui.productImage}
                        height={44}
                        src={product.image.src}
                        width={48}
                      />
                    ) : (
                      <div
                        aria-label={`Product image for ${product.name}`}
                        className={ui.productImage}
                        role="img"
                        style={{
                          background:
                            productImageColors[
                              index % productImageColors.length
                            ],
                        }}
                      >
                        <Boxes size={18} />
                      </div>
                    )}
                    <div>
                      <strong>{product.name}</strong>
                      <span>{product.quantity} units sold</span>
                    </div>
                    <strong>{formatPrice(product.revenue)}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <div className={ui.dashboardColumns}>
        <div className={ui.dashboardStack}>
          <section className={ui.card}>
            <div className={ui.cardHeader}>
              <h2>Payment mix</h2>
            </div>
            <div className={ui.cardBody}>
              <div className={ui.mixList}>
                {paymentRows.map((row) => {
                  const pct =
                    totalOrders > 0
                      ? Math.round((row.value / totalOrders) * 100)
                      : 0;
                  return (
                    <div key={row.label} className={ui.mixRow}>
                      <div>
                        <span>{row.label}</span>
                        <strong>
                          {row.value} orders · {pct}%
                        </strong>
                      </div>
                      <div className={ui.progressTrack}>
                        <span
                          style={{ width: `${pct}%`, background: row.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className={ui.card}>
            <div className={ui.cardHeader}>
              <h2>Activity</h2>
            </div>
            <div className={ui.cardBody}>
              {!activity.length ? (
                <p className={ui.empty}>No recent activity yet.</p>
              ) : (
                <div className={ui.activityList}>
                  {activity.map((item) => (
                    <div key={item.id} className={ui.activityItem}>
                      <span
                        className={`${ui.activityDot} ${
                          item.tone === "danger" ? ui.activityDanger : ""
                        }`}
                      />
                      <div>
                        <p>{item.text}</p>
                        <span>
                          {item.detail} · {formatDate(item.date)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className={ui.dashboardStack}>
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
                        <th>Customer</th>
                        <th>Status</th>
                        <th>Payment</th>
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
                            <td>{getCustomerName(order)}</td>
                            <td>
                              <span
                                className={`${ui.badge} ${getBadgeClass(display.orderTone)}`}
                              >
                                {display.orderLabel}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`${ui.badge} ${getPaymentBadgeClass(display.paymentTone)}`}
                              >
                                {display.paymentLabel}
                              </span>
                            </td>
                            <td>{formatPrice(Number(order.total || 0))}</td>
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
      </div>
    </>
  );
}
