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
import { useMemo } from "react";
import {
  computeOrderStatusSummary,
  computeTopProducts,
} from "@/lib/admin/admin-stats";
import { getOrderDisplayInfo } from "@/lib/checkout/get-order-display";
import { formatPrice } from "@/utils/format-price";
import { formatDate } from "@/utils/formatDate";
import { useAccount } from "../../../(resources)/dashboard-utils/account-context";
import styles from "../../styles.module.scss";

const monthLabels = [
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
];

const fallbackSales = [
  196_000, 210_000, 228_000, 202_000, 266_000, 238_000, 252_000, 270_000,
  258_000, 279_000, 292_000, 280_000,
];

const lowStockItems = [
  { name: "Herbal Detox Tea 20 bags", sku: "HDT-020", stock: "3 Left" },
  { name: "Raw Forest Honey 500g", sku: "RFH-500", stock: "8 Left" },
  { name: "Turmeric Capsules 60ct", sku: "TMC-060", stock: "Out Of Stock" },
  { name: "Aloe Vera Juice 1L", sku: "AVJ-1000", stock: "Out Of Stock" },
];

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

function SalesAreaChart({ values }: { values: number[] }) {
  const max = Math.max(...values, 333_000);
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
  const ticks = [0, 83_000, 166_000, 249_000, 333_000];

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
      {monthLabels.map((label, index) => (
        <text
          key={label}
          x={left + (index / Math.max(1, monthLabels.length - 1)) * plotW}
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
  const firstName = session.user.name?.split(" ")[0] || "Joan";
  const orderHealth = useMemo(
    () => computeOrderStatusSummary(orders),
    [orders],
  );
  const topProducts = useMemo(() => computeTopProducts(orders, 5), [orders]);
  const recentOrders = useMemo(() => [...orders].slice(0, 6), [orders]);

  const summary = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const previousMonth = new Date(currentYear, currentMonth - 1, 1);
    const monthly = Array.from({ length: 12 }, (_, index) => ({
      label: monthLabels[index],
      revenue: 0,
      orders: 0,
    }));

    let totalSales = 0;
    let monthRevenue = 0;
    let previousRevenue = 0;
    let unitsSold = 0;

    for (const order of orders) {
      const total = parseMoney(order.total);
      const date = new Date(order.date_created);
      totalSales += total;
      unitsSold += (order.line_items ?? []).reduce(
        (sum, item) => sum + (item.quantity || 0),
        0,
      );

      const label = monthLabels[date.getMonth()];
      const point = monthly.find((item) => item.label === label);
      if (point) {
        point.revenue += total;
        point.orders += 1;
      }

      if (
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      ) {
        monthRevenue += total;
      }

      if (
        date.getMonth() === previousMonth.getMonth() &&
        date.getFullYear() === previousMonth.getFullYear()
      ) {
        previousRevenue += total;
      }
    }

    const chartValues = monthly.map((item, index) =>
      item.revenue > 0 ? item.revenue : fallbackSales[index],
    );
    const totalOrders = orders.length || 142;
    const revenue = monthRevenue || 284_500;
    const sales = totalSales || 1_842_300;
    const units = unitsSold || 389;
    const averageOrder = totalOrders > 0 ? sales / totalOrders : 2004;

    return {
      totalSales: sales,
      revenue,
      orders: totalOrders,
      unitsSold: units,
      averageOrder,
      revenueTrend: percentChange(revenue, previousRevenue || revenue * 0.88),
      salesTrend: 9.6,
      orderTrend: 8.1,
      unitsTrend: 5.2,
      averageTrend: -1.3,
      chartValues,
    };
  }, [orders]);

  const metrics = [
    {
      label: "Total sales",
      value: formatPrice(summary.totalSales),
      trend: summary.salesTrend,
      icon: TrendingUp,
      tone: "green" as const,
      values: [2, 3, 3.4, 4.1, 5.2, 6.4],
    },
    {
      label: "Revenue",
      value: formatPrice(summary.revenue),
      trend: summary.revenueTrend,
      icon: CreditCard,
      tone: "blue" as const,
      values: [2, 2.6, 2.4, 3, 3.1, 4.2],
    },
    {
      label: "Orders",
      value: String(summary.orders),
      trend: summary.orderTrend,
      icon: ShoppingBag,
      tone: "blue" as const,
      values: [2.3, 2.7, 2.5, 3.6, 4.1, 4.4],
    },
    {
      label: "Units sold",
      value: String(summary.unitsSold),
      trend: summary.unitsTrend,
      icon: Package,
      tone: "orange" as const,
      values: [2.2, 3, 2.7, 3.8, 3.5, 4.1],
    },
    {
      label: "Avg. order",
      value: formatPrice(summary.averageOrder),
      trend: summary.averageTrend,
      icon: ArrowUpRight,
      tone: "purple" as const,
      values: [4, 2.8, 3.2, 2.1, 2.7, 2.5],
    },
  ];

  const activityItems = [
    ["New order #10442 from Amina Yusuf", "8 minutes ago", styles.dotBlue],
    ["M-Pesa payment received · KSh 1,200", "22 minutes ago", styles.dotGreen],
    [
      "Herbal Detox Tea is low on stock (3 left)",
      "1 hour ago",
      styles.dotOrange,
    ],
    ["Coupon WELLNESS15 was redeemed", "2 hours ago", styles.dotPurple],
    ["Order #10438 cancelled by customer", "3 hours ago", styles.dotRed],
  ];

  const productRows = topProducts.length
    ? topProducts
    : [
        { name: "Moringa Powder 250g", quantity: 84, revenue: 71_400 },
        { name: "Raw Forest Honey 500g", quantity: 63, revenue: 75_600 },
        { name: "Cold-Pressed Coconut Oil", quantity: 58, revenue: 56_840 },
        { name: "Turmeric Capsules 60ct", quantity: 47, revenue: 68_150 },
        { name: "Baobab Powder 200g", quantity: 41, revenue: 36_900 },
      ];

  return (
    <div className={styles.pdfDashboard}>
      <section className={styles.pdfHero}>
        <div>
          <h2>Welcome back, {firstName}</h2>
          <p>
            Here is how JK Organics is performing this week. Revenue is up and
            you're on track to hit your monthly goal.
          </p>
          <div className={styles.pdfHeroActions}>
            <Link href="/admin-account/products/new">+ Add product</Link>
            <Link href="/admin-account/orders">View orders</Link>
            <Link href="/admin-account/coupons/new">New coupon</Link>
          </div>
        </div>
        <aside className={styles.goalCard}>
          <div>
            <span>Monthly revenue goal</span>
            <strong>81%</strong>
          </div>
          <p>{formatPrice(summary.revenue)}</p>
          <small>of KSh 350,000 target</small>
          <i />
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
          <SalesAreaChart values={summary.chartValues} />
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
            <strong>4</strong>
          </div>
          <Link href="/admin-account/products">Restock now →</Link>
        </header>
        <div className={styles.lowStockGrid}>
          {lowStockItems.map((item) => {
            const out = item.stock.toLowerCase().includes("out");
            return (
              <div key={item.sku} className={out ? styles.stockOut : ""}>
                <span>
                  <AlertTriangle size={16} />
                </span>
                <p>
                  <strong>{item.name}</strong>
                  <small>SKU: {item.sku}</small>
                </p>
                <em>{item.stock}</em>
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
              </tbody>
            </table>
          </div>
        </article>

        <article className={styles.pdfPanel}>
          <header>
            <h2>Activity</h2>
          </header>
          <div className={styles.activityList}>
            {activityItems.map(([text, time, dot]) => (
              <div key={text}>
                <span className={dot} />
                <p>
                  <strong>{text}</strong>
                  <small>{time}</small>
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <article className={`${styles.pdfPanel} ${styles.topProductsPanel}`}>
        <header>
          <h2>Top products</h2>
        </header>
        <div className={styles.productList}>
          {productRows.map((product) => (
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
        </div>
      </article>
    </div>
  );
}
