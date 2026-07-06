"use client";

import type { CSSProperties } from "react";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Banknote,
  CircleDollarSign,
  CreditCard,
  MapPin,
  Package,
  ReceiptText,
  ShoppingBag,
  TrendingUp,
  Truck,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import {
  computeOrderStatusSummary,
  computePaymentMethodSummary,
  computeTopProducts,
  computeWeeklyComparison,
} from "@/lib/admin/admin-stats";
import { getOrderDisplayInfo } from "@/lib/checkout/get-order-display";
import { formatPrice } from "@/utils/format-price";
import { formatDate } from "@/utils/formatDate";
import { useAccount } from "../../../(resources)/dashboard-utils/account-context";
import OrdersChart from "../../comp/accountPage/two";
import { AdminBadge } from "../ui/admin-badge";
import { AdminEmptyState } from "../ui/admin-empty-state";
import { AdminMetricCard } from "../ui/admin-metric-card";
import { AdminPanel } from "../ui/admin-panel";
import styles from "../../styles.module.scss";

function TrendBadge({
  current,
  previous,
  comparisonLabel = "last week",
}: {
  current: number;
  previous: number;
  comparisonLabel?: string;
}) {
  let percentage = 0;

  if (previous === 0 && current > 0) {
    percentage = 100;
  } else if (previous > 0) {
    percentage = ((current - previous) / previous) * 100;
  }

  const isUp = percentage >= 0;

  return (
    <span className={isUp ? styles.trendUp : styles.trendDown}>
      {isUp ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
      {Math.abs(percentage).toFixed(1)}% vs {comparisonLabel}
    </span>
  );
}

function parseMoney(value: string | number | undefined): number {
  const numeric = Number(String(value ?? 0).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function badgeTone(status: string): "success" | "info" | "warning" | "danger" {
  if (status === "completed") return "success";
  if (status === "processing") return "info";
  if (status === "pending" || status === "on-hold") return "warning";
  return "danger";
}

export default function AdminDashboard() {
  const { orders, session } = useAccount();

  const { thisWeek, lastWeek } = useMemo(
    () => computeWeeklyComparison(orders),
    [orders],
  );

  const orderHealth = useMemo(
    () => computeOrderStatusSummary(orders),
    [orders],
  );
  const paymentMix = useMemo(
    () => computePaymentMethodSummary(orders),
    [orders],
  );
  const topProducts = useMemo(() => computeTopProducts(orders, 5), [orders]);
  const recentOrders = useMemo(() => [...orders].slice(0, 6), [orders]);

  const operationalSummary = useMemo(() => {
    const now = new Date();
    const todayKey = now.toDateString();
    const month = now.getMonth();
    const year = now.getFullYear();
    const previousMonthDate = new Date(year, month - 1, 1);
    const locations = new Map<
      string,
      { location: string; orders: number; sales: number }
    >();

    let todaySales = 0;
    let monthSales = 0;
    let previousMonthSales = 0;
    let yearSales = 0;
    let totalRevenue = 0;
    let deliveryFees = 0;
    let discounts = 0;
    let pendingUnpaid = 0;

    for (const order of orders) {
      const orderDate = new Date(order.date_created);
      const total = parseMoney(order.total);
      const delivery = (order.shipping_lines ?? []).reduce(
        (sum, line) => sum + parseMoney(line.total),
        0,
      );
      const discount = parseMoney(order.discount_total || order.total_discount);
      const location =
        order.billing?.city?.trim() ||
        order.shipping?.city?.trim() ||
        order.billing?.state?.trim() ||
        order.shipping?.state?.trim() ||
        "Unknown";
      const currentLocation = locations.get(location) ?? {
        location,
        orders: 0,
        sales: 0,
      };

      currentLocation.orders += 1;
      currentLocation.sales += total;
      locations.set(location, currentLocation);

      totalRevenue += total;
      deliveryFees += delivery;
      discounts += discount;

      if (orderDate.toDateString() === todayKey) {
        todaySales += total;
      }

      if (orderDate.getMonth() === month && orderDate.getFullYear() === year) {
        monthSales += total;
      }

      if (orderDate.getFullYear() === year) {
        yearSales += total;
      }

      if (
        orderDate.getMonth() === previousMonthDate.getMonth() &&
        orderDate.getFullYear() === previousMonthDate.getFullYear()
      ) {
        previousMonthSales += total;
      }

      if (order.needs_payment || order.status === "pending") {
        pendingUnpaid += 1;
      }
    }

    return {
      todaySales,
      monthSales,
      previousMonthSales,
      yearSales,
      totalRevenue,
      deliveryFees,
      discounts,
      netRevenue: Math.max(0, totalRevenue - deliveryFees),
      pendingUnpaid,
      topLocations: Array.from(locations.values())
        .sort((a, b) => b.sales - a.sales || b.orders - a.orders)
        .slice(0, 5),
    };
  }, [orders]);

  const avgOrder = thisWeek.orders > 0 ? thisWeek.sales / thisWeek.orders : 0;
  const totalPaymentOrders =
    paymentMix.cod + paymentMix.intasend + paymentMix.other;
  const codPercentage = totalPaymentOrders
    ? (paymentMix.cod / totalPaymentOrders) * 100
    : 0;
  const intasendPercentage = totalPaymentOrders
    ? (paymentMix.intasend / totalPaymentOrders) * 100
    : 0;
  const pendingWork =
    orderHealth.pending + orderHealth.onHold + orderHealth.processing;
  const completedRate = orders.length
    ? Math.round((orderHealth.completed / orders.length) * 100)
    : 0;
  const monthTrend =
    operationalSummary.previousMonthSales > 0
      ? ((operationalSummary.monthSales -
          operationalSummary.previousMonthSales) /
          operationalSummary.previousMonthSales) *
        100
      : operationalSummary.monthSales > 0
        ? 100
        : 0;
  const yearShare = operationalSummary.yearSales
    ? Math.round(
        (operationalSummary.monthSales / operationalSummary.yearSales) * 100,
      )
    : 0;
  const firstName = session.user.name?.split(" ")[0] || "there";
  const initials = String(session.user.name || session.user.email || "JK")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const metrics = [
    {
      label: "Revenue",
      value: formatPrice(thisWeek.sales),
      current: thisWeek.sales,
      previous: lastWeek.sales,
      icon: Wallet,
      tone: "success" as const,
    },
    {
      label: "Orders",
      value: String(thisWeek.orders),
      current: thisWeek.orders,
      previous: lastWeek.orders,
      icon: ShoppingBag,
      tone: "info" as const,
    },
    {
      label: "Units sold",
      value: String(thisWeek.products),
      current: thisWeek.products,
      previous: lastWeek.products,
      icon: Package,
      tone: "warning" as const,
    },
    {
      label: "Avg. order",
      value: formatPrice(avgOrder),
      current: avgOrder,
      previous: lastWeek.orders > 0 ? lastWeek.sales / lastWeek.orders : 0,
      icon: TrendingUp,
      tone: "neutral" as const,
    },
  ];

  const insightCards = [
    {
      label: "Delivery fees",
      value: formatPrice(operationalSummary.deliveryFees),
      detail: "Delivery and pickup charges",
      icon: Truck,
    },
    {
      label: "Sales revenue",
      value: formatPrice(operationalSummary.totalRevenue),
      detail: `${orders.length} lifetime orders`,
      icon: ReceiptText,
    },
    {
      label: "Net revenue",
      value: formatPrice(operationalSummary.netRevenue),
      detail: "Order revenue after delivery fees",
      icon: CircleDollarSign,
    },
    {
      label: "Growth",
      value: <TrendBadge current={thisWeek.sales} previous={lastWeek.sales} />,
      detail: "Weekly sales comparison",
      icon: TrendingUp,
    },
    {
      label: "Monthly earnings",
      value: formatPrice(operationalSummary.monthSales),
      detail: "Current calendar month",
      icon: Banknote,
    },
    {
      label: "Payment gateways",
      value: `${paymentMix.intasend} online`,
      detail: `${paymentMix.cod} cash, ${paymentMix.other} other`,
      icon: CreditCard,
    },
  ];

  const paymentDonutStyle = {
    "--cod": `${codPercentage}%`,
    "--intasend": `${codPercentage + intasendPercentage}%`,
  } as CSSProperties;

  return (
    <main className={styles.dashboardCanvas}>
      <section className={styles.welcomeStrip}>
        <div className={styles.welcomeIdentity}>
          <span className={styles.adminAvatar}>{initials}</span>
          <div>
            <p className={styles.eyebrow}>Overview dashboard</p>
            <h1>Welcome back, {firstName}</h1>
            <p>
              Track JK Organics orders, payment movement, delivery load, and
              product momentum from one workspace.
            </p>
          </div>
        </div>

        <div className={styles.performanceBoard}>
          <div>
            <span>Today sales</span>
            <strong>{formatPrice(operationalSummary.todaySales)}</strong>
          </div>
          <div>
            <span>This week</span>
            <strong>{formatPrice(thisWeek.sales)}</strong>
          </div>
          <div>
            <span>Performance</span>
            <strong>{completedRate}% complete</strong>
          </div>
        </div>

        <div className={styles.gardenSummary} aria-label="JK Organics summary">
          <div className={styles.summaryRows}>
            <span style={{ inlineSize: `${Math.max(completedRate, 8)}%` }} />
            <span
              style={{
                inlineSize: `${Math.max(
                  orders.length ? (pendingWork / orders.length) * 100 : 0,
                  8,
                )}%`,
              }}
            />
            <span
              style={{
                inlineSize: `${Math.max(
                  totalPaymentOrders
                    ? (paymentMix.intasend / totalPaymentOrders) * 100
                    : 0,
                  8,
                )}%`,
              }}
            />
          </div>
          <p>
            {pendingWork} active orders, {paymentMix.intasend} online payments,
            and {topProducts[0]?.name || "new product activity"} leading the
            board.
          </p>
        </div>
      </section>

      <section className={styles.metricGrid} aria-label="Weekly KPI cards">
        {metrics.map((metric) => (
          <AdminMetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            icon={metric.icon}
            tone={metric.tone}
            detail={
              <TrendBadge
                current={metric.current}
                previous={metric.previous}
              />
            }
          />
        ))}
      </section>

      <div className={styles.primaryGrid}>
        <div className={styles.mainColumn}>
          <div className={styles.chartGrid}>
            <AdminPanel
              title="Revenue updates"
              description="Order totals over time from the existing sales feed."
              action={
                <Link href="/admin-account/analytics" className={styles.panelLink}>
                  <BarChart3 size={16} aria-hidden />
                  Analytics
                </Link>
              }
            >
              <div className={styles.chartFrame}>
                <OrdersChart orders={orders} />
              </div>
            </AdminPanel>

            <AdminPanel
              title="Sales overview"
              description="Payment method split across current dashboard orders."
            >
              <div className={styles.paymentSummary}>
                <div className={styles.paymentDonut} style={paymentDonutStyle}>
                  <span>{totalPaymentOrders}</span>
                  <small>orders</small>
                </div>
                <div className={styles.legendList}>
                  <div>
                    <span className={styles.legendCash} />
                    Cash on delivery
                    <strong>{paymentMix.cod}</strong>
                  </div>
                  <div>
                    <span className={styles.legendOnline} />
                    M-Pesa / IntaSend
                    <strong>{paymentMix.intasend}</strong>
                  </div>
                  <div>
                    <span className={styles.legendOther} />
                    Other payments
                    <strong>{paymentMix.other}</strong>
                  </div>
                </div>
              </div>
            </AdminPanel>
          </div>

          <AdminPanel
            title="Monthly and yearly sales"
            description="Current month contribution against this year's order revenue."
          >
            <div className={styles.salesPeriodGrid}>
              <div className={styles.salesPeriodPrimary}>
                <span>This month</span>
                <strong>{formatPrice(operationalSummary.monthSales)}</strong>
                <TrendBadge
                  current={operationalSummary.monthSales}
                  previous={operationalSummary.previousMonthSales}
                  comparisonLabel="previous month"
                />
              </div>
              <div>
                <span>This year</span>
                <strong>{formatPrice(operationalSummary.yearSales)}</strong>
                <small>{yearShare}% from the current month</small>
              </div>
              <div>
                <span>Month comparison</span>
                <strong>{Math.abs(monthTrend).toFixed(1)}%</strong>
                <small>
                  {monthTrend >= 0 ? "ahead of" : "behind"} previous month
                </small>
              </div>
            </div>
          </AdminPanel>

          <div className={styles.operationsGrid}>
            <AdminPanel
              title="Weekly stats"
              description="Open workload, shipped orders, and payment follow-up."
            >
              <div className={styles.statRows}>
                <div>
                  <span>Pending</span>
                  <strong>{orderHealth.pending}</strong>
                </div>
                <div>
                  <span>Processing</span>
                  <strong>{orderHealth.processing}</strong>
                </div>
                <div>
                  <span>Completed</span>
                  <strong>{orderHealth.completed}</strong>
                </div>
                <div>
                  <span>Unpaid</span>
                  <strong>{operationalSummary.pendingUnpaid}</strong>
                </div>
              </div>
            </AdminPanel>

            <AdminPanel
              title="Top products"
              description="Best movers by units sold."
            >
              {!topProducts.length ? (
                <AdminEmptyState
                  title="No product sales yet"
                  description="Product movement will appear once orders include line items."
                />
              ) : (
                <div className={styles.compactList}>
                  {topProducts.map((product) => (
                    <div key={product.name} className={styles.compactListItem}>
                      <div>
                        <strong>{product.name}</strong>
                        <span>{formatPrice(product.revenue)}</span>
                      </div>
                      <AdminBadge tone="success">{product.quantity} units</AdminBadge>
                    </div>
                  ))}
                </div>
              )}
            </AdminPanel>

            <AdminPanel
              title="Top locations"
              description="Order concentration by customer city or region."
            >
              {!operationalSummary.topLocations.length ? (
                <AdminEmptyState
                  title="No locations yet"
                  description="Customer locations will appear when orders arrive."
                  icon={MapPin}
                />
              ) : (
                <div className={styles.compactList}>
                  {operationalSummary.topLocations.map((location) => (
                    <div
                      key={location.location}
                      className={styles.compactListItem}
                    >
                      <div>
                        <strong>{location.location}</strong>
                        <span>{location.orders} orders</span>
                      </div>
                      <span>{formatPrice(location.sales)}</span>
                    </div>
                  ))}
                </div>
              )}
            </AdminPanel>

            <AdminPanel
              title="Pending and unpaid"
              description="Orders that may need payment or fulfilment attention."
            >
              <div className={styles.followUpPanel}>
                <strong>{operationalSummary.pendingUnpaid}</strong>
                <span>orders need payment attention</span>
                <Link href="/admin-account/orders">Review queue</Link>
              </div>
            </AdminPanel>
          </div>

          <AdminPanel
            title="Recent orders"
            description="Customer, payment, status, and total at a glance."
            action={<Link href="/admin-account/orders">View all</Link>}
          >
            {!recentOrders.length ? (
              <AdminEmptyState
                title="No orders yet"
                description="Recent customer orders will appear here."
              />
            ) : (
              <div className={styles.ordersTableWrap}>
                <table className={styles.ordersTable}>
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th>Total</th>
                      <th>Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => {
                      const display = getOrderDisplayInfo(order);
                      const customerName = [
                        order.billing?.first_name,
                        order.billing?.last_name,
                      ]
                        .filter(Boolean)
                        .join(" ");

                      return (
                        <tr key={order.id}>
                          <td data-label="Customer">
                            <strong>{customerName || "Guest customer"}</strong>
                            <span>{formatDate(order.date_created)}</span>
                          </td>
                          <td data-label="Status">
                            <AdminBadge tone={badgeTone(order.status)}>
                              {display.orderLabel}
                            </AdminBadge>
                          </td>
                          <td data-label="Payment">
                            {display.paymentLabel || order.payment_method_title}
                          </td>
                          <td data-label="Total">
                            <strong>
                              {order.total} {order.currency}
                            </strong>
                          </td>
                          <td data-label="Order">
                            <Link href={`/admin-account/orders/${order.id}`}>
                              #{order.id}
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </AdminPanel>
        </div>

        <aside className={styles.insightRail} aria-label="Dashboard insights">
          {insightCards.map((item) => {
            const Icon = item.icon;
            return (
              <section key={item.label} className={styles.insightCard}>
                <span className={styles.insightIcon} aria-hidden="true">
                  <Icon size={18} />
                </span>
                <div>
                  <p>{item.label}</p>
                  <strong>{item.value}</strong>
                  <span>{item.detail}</span>
                </div>
              </section>
            );
          })}
        </aside>
      </div>
    </main>
  );
}
