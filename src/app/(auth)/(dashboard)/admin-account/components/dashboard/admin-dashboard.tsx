"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  Box,
  CreditCard,
  Package,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  computeOrderStatusSummary,
  computeTopProducts,
} from "@/lib/admin/admin-stats";
import type { ProductInventoryItem } from "@/lib/admin/product-inventory";
import { getOrderDisplayInfo } from "@/lib/checkout/get-order-display";
import { formatPrice } from "@/utils/format-price";
import { formatDate } from "@/utils/formatDate";
import { useAccount } from "../../../(resources)/dashboard-utils/account-context";
import styles from "../../styles.module.scss";

function parseMoney(value: string | number | undefined | null): number {
  const numeric = Number(String(value ?? 0).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function percentChange(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function compactMoney(value: number) {
  if (value >= 1000) return `${Math.round(value / 1000)}k`;
  return String(Math.round(value));
}

function getCustomerName(order: DashboardOrder) {
  const first = order.billing?.first_name?.trim();
  const last = order.billing?.last_name?.trim();
  const fullName = [first, last].filter(Boolean).join(" ");
  return fullName || "Guest customer";
}

function getStatusTone(status: string) {
  if (status === "completed") return styles.statusCompleted;
  if (status === "processing") return styles.statusProcessing;
  if (status === "pending" || status === "on-hold") return styles.statusPending;
  return styles.statusCancelled;
}

function Sparkline({
  tone,
  values,
}: {
  tone: "green" | "blue" | "orange" | "purple";
  values: number[];
}) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(1, max - min);
  const points = values
    .map((value, index) => {
      const x = 6 + (index / Math.max(1, values.length - 1)) * 84;
      const y = 42 - ((value - min) / range) * 26;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      className={`${styles.sparkline} ${styles[`sparkline${tone}`]}`}
      viewBox="0 0 96 48"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`spark-${tone}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.28" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`6,46 ${points} 90,46`} fill={`url(#spark-${tone})`} />
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SalesAreaChart({
  values,
  labels,
}: {
  values: number[];
  labels: string[];
}) {
  const max = Math.max(...values, 1);
  const width = 820;
  const height = 300;
  const left = 58;
  const right = 24;
  const top = 18;
  const bottom = 42;
  const plotW = width - left - right;
  const plotH = height - top - bottom;
  const points = values.map((value, index) => {
    const x = left + (index / Math.max(1, values.length - 1)) * plotW;
    const y = top + (1 - value / max) * plotH;
    return { x, y, value };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${left},${height - bottom} ${line} ${width - right},${height - bottom}`;
  const ticks = [0, max * 0.25, max * 0.5, max * 0.75, max];

  return (
    <svg
      className={styles.salesChart}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Sales overview chart"
    >
      <defs>
        <linearGradient id="sales-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#249346" stopOpacity="0.26" />
          <stop offset="1" stopColor="#249346" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {ticks.map((tick) => {
        const y = top + (1 - tick / max) * plotH;
        return (
          <g key={tick}>
            <line x1={left} x2={width - right} y1={y} y2={y} stroke="#e8ece8" />
            <text x={left - 10} y={y + 4} textAnchor="end">
              {tick === 0 ? "0" : compactMoney(tick)}
            </text>
          </g>
        );
      })}
      <polygon points={area} fill="url(#sales-fill)" />
      <polyline
        points={line}
        fill="none"
        stroke="#249346"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((point) => (
        <circle
          key={`${point.x}-${point.y}`}
          cx={point.x}
          cy={point.y}
          r="5"
          fill="#fff"
          stroke="#249346"
          strokeWidth="4"
        />
      ))}
      {labels.map((label, index) => (
        <text
          key={label}
          x={left + (index / Math.max(1, labels.length - 1)) * plotW}
          y={height - 12}
          textAnchor="middle"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}

function OrderStatusDonut({
  orderHealth,
  total,
}: {
  orderHealth: ReturnType<typeof computeOrderStatusSummary>;
  total: number;
}) {
  const safeTotal = Math.max(total, 1);
  const completed = (orderHealth.completed / safeTotal) * 100;
  const processing = (orderHealth.processing / safeTotal) * 100;
  const pending = (orderHealth.pending / safeTotal) * 100;
  const onHold = (orderHealth.onHold / safeTotal) * 100;
  const cancelled = (orderHealth.cancelled / safeTotal) * 100;
  const refunded = Math.max(
    0,
    100 - completed - processing - pending - onHold - cancelled,
  );

  return (
    <div className={styles.orderStatusWrap}>
      <div
        className={styles.statusDonut}
        style={
          {
            "--completed": `${completed}%`,
            "--processing": `${completed + processing}%`,
            "--pending": `${completed + processing + pending}%`,
            "--onhold": `${completed + processing + pending + onHold}%`,
            "--cancelled": `${completed + processing + pending + onHold + cancelled}%`,
          } as CSSProperties
        }
      >
        <strong>{total}</strong>
        <span>orders</span>
      </div>
      <div className={styles.statusLegend}>
        {[
          ["Completed", orderHealth.completed, styles.dotGreen],
          ["Processing", orderHealth.processing, styles.dotBlue],
          ["Pending", orderHealth.pending, styles.dotOrange],
          ["On hold", orderHealth.onHold, styles.dotPurple],
          ["Cancelled", orderHealth.cancelled, styles.dotGray],
          [
            "Refunded",
            orderHealth.refunded || Math.round((refunded / 100) * safeTotal),
            styles.dotRed,
          ],
        ].map(([label, value, className]) => (
          <div key={label as string}>
            <span className={className as string} />
            <p>{label}</p>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { orders, session } = useAccount();
  const firstName = session.user.name?.split(" ")[0] || "Admin";
  const [products, setProducts] = useState<ProductInventoryItem[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadProducts() {
      try {
        const response = await fetch("/api/admin/products");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to load stock");
        if (active) setProducts(data.products ?? []);
      } catch (error) {
        if (active) {
          setProductsError(
            error instanceof Error ? error.message : "Failed to load stock",
          );
        }
      } finally {
        if (active) setProductsLoading(false);
      }
    }
    loadProducts();
    return () => {
      active = false;
    };
  }, []);
  const orderHealth = useMemo(
    () => computeOrderStatusSummary(orders),
    [orders],
  );
  const topProducts = useMemo(() => computeTopProducts(orders, 5), [orders]);
  const recentOrders = useMemo(() => [...orders].slice(0, 6), [orders]);
  const lowStockItems = useMemo(
    () =>
      products
        .filter(
          (product) =>
            product.stockStatus === "outofstock" ||
            (product.stockQuantity !== null && product.stockQuantity <= 5),
        )
        .sort((a, b) => (a.stockQuantity ?? 0) - (b.stockQuantity ?? 0))
        .slice(0, 4),
    [products],
  );

  const summary = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const previousMonth = new Date(currentYear, currentMonth - 1, 1);
    const monthly = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(currentYear, currentMonth - 11 + index, 1);
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: date.toLocaleDateString("en-KE", { month: "short" }),
        revenue: 0,
        orders: 0,
        units: 0,
      };
    });

    let totalSales = 0;
    let monthRevenue = 0;
    let previousRevenue = 0;
    let monthOrders = 0;
    let previousOrders = 0;
    let monthUnits = 0;
    let previousUnits = 0;
    let unitsSold = 0;

    for (const order of orders) {
      const total = parseMoney(order.total);
      const date = new Date(order.date_created);
      totalSales += total;
      unitsSold += (order.line_items ?? []).reduce(
        (sum, item) => sum + (item.quantity || 0),
        0,
      );

      const orderUnits = (order.line_items ?? []).reduce(
        (sum, item) => sum + (item.quantity || 0),
        0,
      );
      const point = monthly.find(
        (item) => item.key === `${date.getFullYear()}-${date.getMonth()}`,
      );
      if (point) {
        point.revenue += total;
        point.orders += 1;
        point.units += orderUnits;
      }

      if (
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      ) {
        monthRevenue += total;
        monthOrders += 1;
        monthUnits += orderUnits;
      }

      if (
        date.getMonth() === previousMonth.getMonth() &&
        date.getFullYear() === previousMonth.getFullYear()
      ) {
        previousRevenue += total;
        previousOrders += 1;
        previousUnits += orderUnits;
      }
    }

    const chartValues = monthly.map((item) => item.revenue);
    const chartLabels = monthly.map((item) => item.label);
    const totalOrders = orders.length;
    const averageOrder = totalOrders > 0 ? totalSales / totalOrders : 0;
    const currentAverage = monthOrders > 0 ? monthRevenue / monthOrders : 0;
    const previousAverage =
      previousOrders > 0 ? previousRevenue / previousOrders : 0;

    return {
      totalSales,
      revenue: monthRevenue,
      orders: totalOrders,
      unitsSold,
      averageOrder,
      revenueTrend: percentChange(monthRevenue, previousRevenue),
      salesTrend: percentChange(monthRevenue, previousRevenue),
      orderTrend: percentChange(monthOrders, previousOrders),
      unitsTrend: percentChange(monthUnits, previousUnits),
      averageTrend: percentChange(currentAverage, previousAverage),
      chartValues,
      chartLabels,
      monthlyOrders: monthly.map((item) => item.orders),
      monthlyUnits: monthly.map((item) => item.units),
    };
  }, [orders]);

  const metrics = [
    {
      label: "Total sales",
      value: formatPrice(summary.totalSales),
      trend: summary.salesTrend,
      icon: TrendingUp,
      tone: "green" as const,
      values: summary.chartValues.slice(-6),
    },
    {
      label: "Revenue",
      value: formatPrice(summary.revenue),
      trend: summary.revenueTrend,
      icon: CreditCard,
      tone: "blue" as const,
      values: summary.chartValues.slice(-6),
    },
    {
      label: "Orders",
      value: String(summary.orders),
      trend: summary.orderTrend,
      icon: ShoppingBag,
      tone: "blue" as const,
      values: summary.monthlyOrders.slice(-6),
    },
    {
      label: "Units sold",
      value: String(summary.unitsSold),
      trend: summary.unitsTrend,
      icon: Package,
      tone: "orange" as const,
      values: summary.monthlyUnits.slice(-6),
    },
    {
      label: "Avg. order",
      value: formatPrice(summary.averageOrder),
      trend: summary.averageTrend,
      icon: ArrowUpRight,
      tone: "purple" as const,
      values: summary.chartValues.slice(-6),
    },
  ];

  const activityItems = recentOrders.map((order) => ({
    text: `Order #${order.id} from ${getCustomerName(order)} · ${getOrderDisplayInfo(order).orderLabel}`,
    time: formatDate(order.date_created),
    dot: getStatusTone(order.status),
  }));

  return (
    <div className={styles.pdfDashboard}>
      <section className={styles.pdfHero}>
        <div>
          <h2>Welcome back, {firstName}</h2>
          <p>Live store performance from WooCommerce orders and inventory.</p>
          <div className={styles.pdfHeroActions}>
            <Link href="/admin-account/products/new">+ Add product</Link>
            <Link href="/admin-account/orders">View orders</Link>
            <Link href="/admin-account/coupons/new">New coupon</Link>
          </div>
        </div>
        <aside className={styles.goalCard}>
          <div>
            <span>Current month revenue</span>
          </div>
          <p>{formatPrice(summary.revenue)}</p>
          <small>Calculated from loaded orders</small>
        </aside>
      </section>

      <section className={styles.pdfMetricGrid}>
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const isDown = metric.trend < 0;
          return (
            <article key={metric.label} className={styles.pdfMetricCard}>
              <div>
                <span>{metric.label}</span>
                <span
                  className={`${styles.pdfMetricIcon} ${styles[`pdfMetric${metric.tone}`]}`}
                >
                  <Icon size={18} />
                </span>
              </div>
              <strong>{metric.value}</strong>
              <em className={isDown ? styles.metricDown : styles.metricUp}>
                {isDown ? "" : "+"}
                {metric.trend.toFixed(1)}%
              </em>
              <Sparkline tone={metric.tone} values={metric.values} />
            </article>
          );
        })}
      </section>

      <section className={styles.pdfChartGrid}>
        <article className={styles.pdfPanel}>
          <header>
            <div>
              <h2>Sales overview</h2>
              <p>Revenue & orders per month</p>
            </div>
            <div className={styles.periodToggle}>
              <span>6M</span>
              <strong>12M</strong>
            </div>
          </header>
          {orders.length ? (
            <SalesAreaChart
              values={summary.chartValues}
              labels={summary.chartLabels}
            />
          ) : (
            <p>No sales data yet.</p>
          )}
        </article>

        <article className={styles.pdfPanel}>
          <header>
            <h2>Order status</h2>
          </header>
          <OrderStatusDonut orderHealth={orderHealth} total={summary.orders} />
        </article>
      </section>

      <section className={styles.lowStockPanel}>
        <header>
          <div>
            <span>
              <AlertTriangle size={18} />
            </span>
            <h2>Low stock alerts</h2>
            <strong>{lowStockItems.length}</strong>
          </div>
          <Link href="/admin-account/products">Restock now →</Link>
        </header>
        <div className={styles.lowStockGrid}>
          {productsLoading && <p>Loading inventory...</p>}
          {productsError && <p>Inventory unavailable: {productsError}</p>}
          {!productsLoading && !productsError && !lowStockItems.length && (
            <p>No low-stock products.</p>
          )}
          {lowStockItems.map((item) => {
            const out = item.stockStatus === "outofstock";
            const stock = out ? "Out of stock" : `${item.stockQuantity} left`;
            return (
              <div key={item.sku} className={out ? styles.stockOut : ""}>
                <span>
                  <AlertTriangle size={16} />
                </span>
                <p>
                  <strong>{item.name}</strong>
                  <small>SKU: {item.sku}</small>
                </p>
                <em>{stock}</em>
              </div>
            );
          })}
        </div>
      </section>

      <section className={styles.pdfLowerGrid}>
        <article className={styles.pdfPanel}>
          <header>
            <h2>Recent orders</h2>
            <Link href="/admin-account/orders">View all</Link>
          </header>
          <div className={styles.pdfTableWrap}>
            <table className={styles.pdfOrdersTable}>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
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
                        <small>{formatDate(order.date_created)}</small>
                      </td>
                      <td>{getCustomerName(order)}</td>
                      <td>
                        <span
                          className={`${styles.statusPill} ${getStatusTone(order.status)}`}
                        >
                          {display.orderLabel}
                        </span>
                      </td>
                      <td>{formatPrice(parseMoney(order.total))}</td>
                    </tr>
                  );
                })}
                {!recentOrders.length && (
                  <tr>
                    <td colSpan={4}>No recent orders yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className={styles.pdfPanel}>
          <header>
            <h2>Activity</h2>
          </header>
          <div className={styles.activityList}>
            {activityItems.map((item) => (
              <div key={item.text}>
                <span className={item.dot} />
                <p>
                  <strong>{item.text}</strong>
                  <small>{item.time}</small>
                </p>
              </div>
            ))}
            {!activityItems.length && <p>No order activity yet.</p>}
          </div>
        </article>
      </section>

      <article className={`${styles.pdfPanel} ${styles.topProductsPanel}`}>
        <header>
          <h2>Top products</h2>
        </header>
        <div className={styles.productList}>
          {topProducts.map((product) => (
            <div key={product.name}>
              <span>
                <Box size={17} />
              </span>
              <p>
                <strong>{product.name}</strong>
                <small>{product.quantity} units sold</small>
              </p>
              <em>{formatPrice(product.revenue)}</em>
            </div>
          ))}
          {!topProducts.length && <p>No product sales yet.</p>}
        </div>
      </article>
    </div>
  );
}
