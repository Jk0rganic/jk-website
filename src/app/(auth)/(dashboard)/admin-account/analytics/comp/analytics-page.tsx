"use client";

import {
  AlertCircle,
  Banknote,
  Boxes,
  CreditCard,
  MapPin,
  Package,
  Percent,
  ReceiptText,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatPrice } from "@/utils/format-price";
import ui from "../../components/ui/admin-ui.module.scss";
import { PageHeader } from "../../components/ui/page-header";
import styles from "../styles.module.scss";
import DateRangeControls, {
  type AnalyticsDatePreset,
  type DateRangeControlValue,
} from "./date-range-controls";

type AnalyticsDateRange = {
  preset: AnalyticsDatePreset | "comparison";
  after: string;
  before: string;
};

type RevenueSummary = {
  grossProductSales: number;
  totalOrderRevenue: number;
  totalDeliveryFees: number;
  totalDiscounts: number;
  averageOrderValue: number;
  unitsSold: number;
  orderCount: number;
};

type PaymentSummary = {
  cashTotal: number;
  mpesaIntasendTotal: number;
  otherTotal: number;
  cashOrders: number;
  mpesaIntasendOrders: number;
  otherOrders: number;
};

type ProductSummary = {
  topProducts: Array<{
    productId: number;
    name: string;
    unitsSold: number;
    revenue: number;
  }>;
  productsWithNoSales: Array<{ id: number; name: string }>;
};

type LocationSummary = {
  topLocations: Array<{ location: string; orders: number; revenue: number }>;
  deliveryTypeSplit: Array<{ type: string; orders: number; revenue: number }>;
};

type DiscountSummary = {
  totalDiscounts: number;
  discountedOrders: number;
  couponCount: number;
  coupons: Array<{ code: string; orders: number; discount: number }>;
};

type OrderBehaviorSummary = {
  orderCount: number;
  unpaidOrPendingOrders: number;
  unpaidPendingRate: number;
  averageOrderValue: number;
  unitsSold: number;
};

type AnalyticsOverview = {
  revenue: RevenueSummary;
  payments: PaymentSummary;
  products: ProductSummary;
  locations: LocationSummary;
  discounts: DiscountSummary;
  behavior: OrderBehaviorSummary;
  insights?: string[];
};

type AnalyticsOverviewResponse = {
  dateRange?: AnalyticsDateRange;
  overview?: AnalyticsOverview;
  comparisonRange?: AnalyticsDateRange;
  comparisonOverview?: AnalyticsOverview;
  insights?: string[];
  error?: string;
};

type KpiItem = {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
  iconClass: string;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-KE").format(value);
}

export function formatShortDate(value?: string) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-KE", {
    month: "short",
    day: "numeric",
    timeZone: "Africa/Nairobi",
  }).format(new Date(value));
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function buildQuery(range: DateRangeControlValue, nonce: number) {
  const params = new URLSearchParams();
  params.set("preset", range.preset);
  params.set("compare", "true");

  if (range.preset === "custom") {
    if (range.after) params.set("after", range.after);
    if (range.before) params.set("before", range.before);
  }

  if (nonce > 0) {
    params.set("refresh", String(nonce));
  }

  return params;
}

function queryToRange(searchParams: URLSearchParams): DateRangeControlValue {
  const preset = searchParams.get("preset") as AnalyticsDatePreset | null;
  const allowedPresets = new Set<AnalyticsDatePreset>([
    "today",
    "yesterday",
    "last_7_days",
    "month_to_date",
    "last_month",
    "year_to_date",
    "custom",
  ]);

  return {
    preset: preset && allowedPresets.has(preset) ? preset : "last_7_days",
    after: searchParams.get("after") || "",
    before: searchParams.get("before") || "",
  };
}

function getInsights(data: AnalyticsOverviewResponse | null) {
  const explicitInsights = data?.overview?.insights ?? data?.insights ?? [];
  if (explicitInsights.length) return explicitInsights;

  const overview = data?.overview;
  if (!overview) return [];

  const insights: string[] = [];
  const topProduct = overview.products.topProducts[0];
  const topLocation = overview.locations.topLocations[0];

  if (topProduct) {
    insights.push(
      `${topProduct.name} leads product sales with ${formatNumber(
        topProduct.unitsSold,
      )} units sold.`,
    );
  }

  if (topLocation) {
    insights.push(
      `${topLocation.location} is the top location with ${formatNumber(
        topLocation.orders,
      )} orders.`,
    );
  }

  if (overview.behavior.unpaidOrPendingOrders > 0) {
    insights.push(
      `${formatPercent(
        overview.behavior.unpaidPendingRate,
      )} of orders are unpaid or pending.`,
    );
  }

  return insights;
}

function KpiCard({ item }: { item: KpiItem }) {
  const Icon = item.icon;

  return (
    <article className={ui.statCard}>
      <div className={ui.statTop}>
        <span className={ui.statLabel}>{item.label}</span>
        <span className={`${ui.statIcon} ${item.iconClass}`}>
          <Icon size={18} aria-hidden />
        </span>
      </div>
      <div className={ui.statValue}>{item.value}</div>
    </article>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className={ui.empty}>{message}</p>;
}

function LoadingState() {
  return (
    <div className={styles.statePanel}>
      <RefreshCw className={styles.spin} aria-hidden />
      <span>Loading analytics</span>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className={styles.statePanel}>
      <AlertCircle aria-hidden />
      <span>{message}</span>
      <button type="button" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

function RevenueChart({
  current,
  comparison,
  currentLabel,
  comparisonLabel,
}: {
  current: AnalyticsOverview;
  comparison?: AnalyticsOverview;
  currentLabel: string;
  comparisonLabel: string;
}) {
  const chartData = [
    {
      period: comparisonLabel,
      Revenue: comparison?.revenue.totalOrderRevenue ?? 0,
      Orders: comparison?.revenue.orderCount ?? 0,
    },
    {
      period: currentLabel,
      Revenue: current.revenue.totalOrderRevenue,
      Orders: current.revenue.orderCount,
    },
  ];

  return (
    <div className={styles.chart}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="period" tickLine={false} axisLine={false} />
          <YAxis
            yAxisId="money"
            tickLine={false}
            axisLine={false}
            width={78}
            tickFormatter={(value) => `KSh ${formatNumber(Number(value))}`}
          />
          <YAxis
            yAxisId="orders"
            orientation="right"
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip
            formatter={(value, name) =>
              name === "Revenue"
                ? [formatPrice(Number(value)), name]
                : [formatNumber(Number(value)), name]
            }
          />
          <Legend />
          <Bar
            yAxisId="money"
            dataKey="Revenue"
            fill="#249346"
            radius={[6, 6, 0, 0]}
          />
          <Bar
            yAxisId="orders"
            dataKey="Orders"
            fill="#2563eb"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [range, setRange] = useState<DateRangeControlValue>(() =>
    queryToRange(searchParams),
  );
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [data, setData] = useState<AnalyticsOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const queryString = useMemo(
    () => buildQuery(range, refreshNonce).toString(),
    [range, refreshNonce],
  );

  useEffect(() => {
    const nextRange = queryToRange(searchParams);
    setRange((current) =>
      current.preset === nextRange.preset &&
      current.after === nextRange.after &&
      current.before === nextRange.before
        ? current
        : nextRange,
    );
  }, [searchParams]);

  useEffect(() => {
    router.replace(`${pathname}?${queryString}`, { scroll: false });
  }, [pathname, queryString, router]);

  const loadAnalytics = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/admin/analytics/overview?${queryString}`,
          {
            signal,
          },
        );
        const nextData = (await response.json()) as AnalyticsOverviewResponse;

        if (!response.ok) {
          throw new Error(nextData.error || "Failed to load analytics");
        }

        setData(nextData);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;

        setError(
          err instanceof Error ? err.message : "Failed to load analytics",
        );
        setData(null);
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [queryString],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadAnalytics(controller.signal);

    return () => controller.abort();
  }, [loadAnalytics]);

  const overview = data?.overview;
  const insights = getInsights(data);
  const hasOrders = Boolean(overview?.revenue.orderCount);

  const kpis: KpiItem[] = overview
    ? [
        {
          label: "Total revenue",
          value: formatPrice(overview.revenue.totalOrderRevenue),
          icon: Wallet,
          iconClass: ui.iconGreen,
        },
        {
          label: "Net product revenue",
          value: formatPrice(
            overview.revenue.grossProductSales -
              overview.revenue.totalDiscounts,
          ),
          icon: ReceiptText,
          iconClass: ui.iconBlue,
        },
        {
          label: "Delivery fees",
          value: formatPrice(overview.revenue.totalDeliveryFees),
          icon: Package,
          iconClass: styles.iconCyan,
        },
        {
          label: "Discounts",
          value: formatPrice(overview.revenue.totalDiscounts),
          icon: Percent,
          iconClass: styles.iconRed,
        },
        {
          label: "Orders",
          value: formatNumber(overview.revenue.orderCount),
          icon: ShoppingBag,
          iconClass: ui.iconAmber,
        },
        {
          label: "Average order value",
          value: formatPrice(overview.revenue.averageOrderValue),
          icon: TrendingUp,
          iconClass: ui.iconViolet,
        },
        {
          label: "Units sold",
          value: formatNumber(overview.revenue.unitsSold),
          icon: Boxes,
          iconClass: styles.iconSlate,
        },
      ]
    : [];

  const paymentCards = overview
    ? [
        {
          label: "Cash",
          total: overview.payments.cashTotal,
          orders: overview.payments.cashOrders,
          icon: Banknote,
        },
        {
          label: "M-Pesa",
          total: overview.payments.mpesaIntasendTotal,
          orders: overview.payments.mpesaIntasendOrders,
          icon: CreditCard,
        },
      ]
    : [];

  const currentLabel = data?.dateRange
    ? `${formatShortDate(data.dateRange.after)} - ${formatShortDate(
        data.dateRange.before,
      )}`
    : "Current";
  const comparisonLabel = data?.comparisonRange
    ? `${formatShortDate(data.comparisonRange.after)} - ${formatShortDate(
        data.comparisonRange.before,
      )}`
    : "Previous";

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Sales performance, payment mix, and location demand."
        action={
          <DateRangeControls
            value={range}
            loading={loading}
            onChange={setRange}
            onRefresh={() => setRefreshNonce((current) => current + 1)}
          />
        }
      />

      {error ? (
        <ErrorState
          message={error}
          onRetry={() => setRefreshNonce((current) => current + 1)}
        />
      ) : loading && !overview ? (
        <LoadingState />
      ) : !overview || !hasOrders ? (
        <section className={ui.card}>
          <EmptyState message="No analytics data for this range." />
        </section>
      ) : (
        <>
          <div className={styles.kpiGrid}>
            {kpis.map((item) => (
              <KpiCard key={item.label} item={item} />
            ))}
          </div>

          <div className={styles.mainGrid}>
            <section className={ui.card}>
              <div className={ui.cardHeader}>
                <h2>Revenue and orders</h2>
                {loading && <RefreshCw className={styles.spin} aria-hidden />}
              </div>
              <div className={ui.cardBody}>
                <RevenueChart
                  current={overview}
                  comparison={data?.comparisonOverview}
                  currentLabel={currentLabel}
                  comparisonLabel={comparisonLabel}
                />
              </div>
            </section>

            <section className={ui.card}>
              <div className={ui.cardHeader}>
                <h2>Payment split</h2>
              </div>
              <div className={ui.cardBody}>
                <div className={styles.paymentGrid}>
                  {paymentCards.map((payment) => {
                    const Icon = payment.icon;
                    return (
                      <article
                        key={payment.label}
                        className={styles.paymentCard}
                      >
                        <div>
                          <span>{payment.label}</span>
                          <strong>{formatPrice(payment.total)}</strong>
                        </div>
                        <Icon aria-hidden />
                        <small>{formatNumber(payment.orders)} orders</small>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>

          <div className={styles.secondaryGrid}>
            <section className={ui.card}>
              <div className={ui.cardHeader}>
                <h2>Top products</h2>
              </div>
              <div className={ui.cardBody}>
                {!overview.products.topProducts.length ? (
                  <EmptyState message="No product sales for this range." />
                ) : (
                  <div className={ui.tableWrap}>
                    <table className={ui.table}>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Units</th>
                          <th>Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overview.products.topProducts
                          .slice(0, 6)
                          .map((product) => (
                            <tr key={product.productId}>
                              <td>{product.name}</td>
                              <td>{formatNumber(product.unitsSold)}</td>
                              <td>{formatPrice(product.revenue)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>

            <section className={ui.card}>
              <div className={ui.cardHeader}>
                <h2>Top locations</h2>
              </div>
              <div className={ui.cardBody}>
                {!overview.locations.topLocations.length ? (
                  <EmptyState message="No location demand for this range." />
                ) : (
                  <div className={ui.tableWrap}>
                    <table className={ui.table}>
                      <thead>
                        <tr>
                          <th>Location</th>
                          <th>Orders</th>
                          <th>Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overview.locations.topLocations
                          .slice(0, 6)
                          .map((location) => (
                            <tr key={location.location}>
                              <td>
                                <span className={styles.locationName}>
                                  <MapPin size={14} aria-hidden />
                                  {location.location}
                                </span>
                              </td>
                              <td>{formatNumber(location.orders)}</td>
                              <td>{formatPrice(location.revenue)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </div>

          {insights.length > 0 && (
            <section
              className={styles.insights}
              aria-label="Analytics insights"
            >
              {insights.slice(0, 3).map((insight) => (
                <article key={insight}>
                  <AlertCircle size={18} aria-hidden />
                  <p>{insight}</p>
                </article>
              ))}
            </section>
          )}
        </>
      )}
    </>
  );
}
