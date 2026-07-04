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
import { buildAnalyticsExportFilename } from "@/lib/admin/analytics-csv";
import { formatPrice } from "@/utils/format-price";
import ui from "../../components/ui/admin-ui.module.scss";
import { PageHeader } from "../../components/ui/page-header";
import styles from "../styles.module.scss";
import DateRangeControls, {
  type AnalyticsDatePreset,
  type DateRangeControlValue,
} from "./date-range-controls";
import ReportTable, { type ReportColumn } from "./report-table";

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

type ProductReportRow = {
  productId: number;
  name: string;
  unitsSold: number;
  revenue: number;
  orderCount: number;
  averageItemValue: number;
  trend: number | null;
  status: "Top seller" | "Slow mover" | "No sales" | "Active" | string;
};

type LocationReportRow = {
  location: string;
  orders: number;
  revenue: number;
  deliveryFees: number;
  topDeliveryType: string;
  orderShare: number;
};

type PaymentReportRow = {
  method: string;
  paidTotal: number;
  orderCount: number;
  pendingCount: number;
  failedCount: number;
  pendingRate: number;
};

type DiscountReportRow = {
  code: string;
  orders: number;
  grossRevenue: number;
  discount: number;
  revenueAfterDiscount: number;
  averageDiscountPerOrder: number;
};

type ProductsReportResponse = {
  rows?: ProductReportRow[];
  productsWithNoSales?: ProductReportRow[];
  error?: string;
};

type LocationsReportResponse = {
  rows?: LocationReportRow[];
  error?: string;
};

type PaymentsReportResponse = {
  rows?: PaymentReportRow[];
  error?: string;
};

type DiscountsReportResponse = {
  rows?: DiscountReportRow[];
  error?: string;
};

type ReportData = {
  products: ProductReportRow[];
  locations: LocationReportRow[];
  payments: PaymentReportRow[];
  discounts: DiscountReportRow[];
};

type ReportKey = keyof ReportData;
type VisibleColumnPreferences = Partial<Record<ReportKey, string[]>>;

const REPORT_TAB_STORAGE_KEY = "jk-admin-analytics-report-tab";
const REPORT_COLUMNS_STORAGE_KEY = "jk-admin-analytics-report-columns";
const DATE_PRESET_STORAGE_KEY = "jk-admin-analytics-date-preset";
const REPORT_KEYS: ReportKey[] = [
  "products",
  "locations",
  "payments",
  "discounts",
];

function canUseStorage() {
  if (typeof window === "undefined") return false;

  try {
    return Boolean(window.localStorage);
  } catch {
    return false;
  }
}

function readStoredReportKey(): ReportKey {
  if (!canUseStorage()) return "products";

  const storedValue = window.localStorage.getItem(REPORT_TAB_STORAGE_KEY);
  return REPORT_KEYS.includes(storedValue as ReportKey)
    ? (storedValue as ReportKey)
    : "products";
}

function readStoredPreset(): AnalyticsDatePreset | null {
  if (!canUseStorage()) return null;

  const storedValue = window.localStorage.getItem(DATE_PRESET_STORAGE_KEY);
  const allowedPresets: AnalyticsDatePreset[] = [
    "today",
    "yesterday",
    "last_7_days",
    "month_to_date",
    "last_month",
    "year_to_date",
    "custom",
  ];

  return allowedPresets.includes(storedValue as AnalyticsDatePreset)
    ? (storedValue as AnalyticsDatePreset)
    : null;
}

function readStoredVisibleColumns(): VisibleColumnPreferences {
  if (!canUseStorage()) return {};

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(REPORT_COLUMNS_STORAGE_KEY) ?? "{}",
    ) as VisibleColumnPreferences;

    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStorage(key: string, value: string) {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Preferences are best-effort only.
  }
}

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

function formatOptionalTrend(value: number | null | undefined) {
  if (typeof value !== "number") return "Not available";
  return `${value > 0 ? "+" : ""}${formatPercent(value)}`;
}

function formatDeliveryType(value: string) {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusClass(status: string) {
  if (status === "Top seller" || status === "Active") return styles.statusGood;
  if (status === "Slow mover") return styles.statusWarn;
  return styles.statusNeutral;
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

function queryToRange(
  searchParams: URLSearchParams,
  fallbackPreset: AnalyticsDatePreset = "last_7_days",
): DateRangeControlValue {
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
    preset: preset && allowedPresets.has(preset) ? preset : fallbackPreset,
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
    queryToRange(searchParams, readStoredPreset() ?? "last_7_days"),
  );
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [data, setData] = useState<AnalyticsOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeReport, setActiveReport] =
    useState<ReportKey>(readStoredReportKey);
  const [visibleColumnPreferences, setVisibleColumnPreferences] =
    useState<VisibleColumnPreferences>(readStoredVisibleColumns);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState<string | null>(null);

  const queryString = useMemo(
    () => buildQuery(range, refreshNonce).toString(),
    [range, refreshNonce],
  );

  useEffect(() => {
    const nextRange = queryToRange(
      searchParams,
      readStoredPreset() ?? "last_7_days",
    );
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

  const handleRangeChange = useCallback((nextRange: DateRangeControlValue) => {
    writeStorage(DATE_PRESET_STORAGE_KEY, nextRange.preset);
    setRange(nextRange);
  }, []);

  const handleReportChange = (nextReport: ReportKey) => {
    writeStorage(REPORT_TAB_STORAGE_KEY, nextReport);
    setActiveReport(nextReport);
  };

  const handleVisibleColumnsChange = (
    report: ReportKey,
    columnKeys: string[],
  ) => {
    setVisibleColumnPreferences((current) => {
      const nextPreferences = { ...current, [report]: columnKeys };
      writeStorage(REPORT_COLUMNS_STORAGE_KEY, JSON.stringify(nextPreferences));
      return nextPreferences;
    });
  };

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

  const loadReports = useCallback(
    async (signal: AbortSignal) => {
      setReportsLoading(true);
      setReportsError(null);

      try {
        const [products, locations, payments, discounts] = await Promise.all([
          fetch(`/api/admin/analytics/products?${queryString}`, { signal }),
          fetch(`/api/admin/analytics/locations?${queryString}`, { signal }),
          fetch(`/api/admin/analytics/payments?${queryString}`, { signal }),
          fetch(`/api/admin/analytics/discounts?${queryString}`, { signal }),
        ]);
        const [productsJson, locationsJson, paymentsJson, discountsJson] =
          (await Promise.all([
            products.json(),
            locations.json(),
            payments.json(),
            discounts.json(),
          ])) as [
            ProductsReportResponse,
            LocationsReportResponse,
            PaymentsReportResponse,
            DiscountsReportResponse,
          ];

        const failedReport =
          productsJson.error ||
          locationsJson.error ||
          paymentsJson.error ||
          discountsJson.error;

        if (
          failedReport ||
          !products.ok ||
          !locations.ok ||
          !payments.ok ||
          !discounts.ok
        ) {
          throw new Error(failedReport || "Failed to load report data");
        }

        setReportData({
          products: [
            ...(productsJson.rows ?? []),
            ...(productsJson.productsWithNoSales ?? []),
          ],
          locations: locationsJson.rows ?? [],
          payments: paymentsJson.rows ?? [],
          discounts: discountsJson.rows ?? [],
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;

        setReportsError(
          err instanceof Error ? err.message : "Failed to load report data",
        );
        setReportData(null);
      } finally {
        if (!signal.aborted) {
          setReportsLoading(false);
        }
      }
    },
    [queryString],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadReports(controller.signal);

    return () => controller.abort();
  }, [loadReports]);

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

  const productColumns = useMemo<ReportColumn<ProductReportRow>[]>(
    () => [
      {
        key: "product",
        header: "Product",
        searchValue: (row) => row.name,
        sortValue: (row) => row.name,
        csvValue: (row) => row.name,
        render: (row) => row.name,
      },
      {
        key: "unitsSold",
        header: "Quantity sold",
        sortValue: (row) => row.unitsSold,
        csvValue: (row) => row.unitsSold,
        render: (row) => formatNumber(row.unitsSold),
        align: "right",
      },
      {
        key: "revenue",
        header: "Revenue",
        sortValue: (row) => row.revenue,
        csvValue: (row) => row.revenue,
        render: (row) => formatPrice(row.revenue),
        align: "right",
      },
      {
        key: "orderCount",
        header: "Orders",
        sortValue: (row) => row.orderCount,
        csvValue: (row) => row.orderCount,
        render: (row) => formatNumber(row.orderCount),
        align: "right",
      },
      {
        key: "averageItemValue",
        header: "Avg item",
        sortValue: (row) => row.averageItemValue,
        csvValue: (row) => row.averageItemValue,
        render: (row) => formatPrice(row.averageItemValue),
        align: "right",
      },
      {
        key: "trend",
        header: "Trend",
        sortValue: (row) => row.trend ?? 0,
        csvValue: (row) => formatOptionalTrend(row.trend),
        render: (row) => formatOptionalTrend(row.trend),
        align: "right",
      },
      {
        key: "status",
        header: "Status",
        searchValue: (row) => row.status,
        sortValue: (row) => row.status,
        csvValue: (row) => row.status,
        render: (row) => (
          <span className={`${styles.statusBadge} ${statusClass(row.status)}`}>
            {row.status}
          </span>
        ),
      },
    ],
    [],
  );

  const locationColumns = useMemo<ReportColumn<LocationReportRow>[]>(
    () => [
      {
        key: "location",
        header: "County / city",
        searchValue: (row) => row.location,
        sortValue: (row) => row.location,
        csvValue: (row) => row.location,
        render: (row) => (
          <span className={styles.locationName}>
            <MapPin size={14} aria-hidden />
            {row.location}
          </span>
        ),
      },
      {
        key: "orders",
        header: "Orders",
        sortValue: (row) => row.orders,
        csvValue: (row) => row.orders,
        render: (row) => formatNumber(row.orders),
        align: "right",
      },
      {
        key: "revenue",
        header: "Revenue",
        sortValue: (row) => row.revenue,
        csvValue: (row) => row.revenue,
        render: (row) => formatPrice(row.revenue),
        align: "right",
      },
      {
        key: "deliveryFees",
        header: "Delivery fees",
        sortValue: (row) => row.deliveryFees,
        csvValue: (row) => row.deliveryFees,
        render: (row) => formatPrice(row.deliveryFees),
        align: "right",
      },
      {
        key: "topDeliveryType",
        header: "Top delivery",
        searchValue: (row) => formatDeliveryType(row.topDeliveryType),
        sortValue: (row) => row.topDeliveryType,
        csvValue: (row) => formatDeliveryType(row.topDeliveryType),
        render: (row) => formatDeliveryType(row.topDeliveryType),
      },
      {
        key: "orderShare",
        header: "Share",
        sortValue: (row) => row.orderShare,
        csvValue: (row) => row.orderShare,
        render: (row) => formatPercent(row.orderShare),
        align: "right",
      },
    ],
    [],
  );

  const paymentColumns = useMemo<ReportColumn<PaymentReportRow>[]>(
    () => [
      {
        key: "method",
        header: "Payment method",
        searchValue: (row) => row.method,
        sortValue: (row) => row.method,
        csvValue: (row) => row.method,
        render: (row) => row.method,
      },
      {
        key: "paidTotal",
        header: "Paid total",
        sortValue: (row) => row.paidTotal,
        csvValue: (row) => row.paidTotal,
        render: (row) => formatPrice(row.paidTotal),
        align: "right",
      },
      {
        key: "orderCount",
        header: "Orders",
        sortValue: (row) => row.orderCount,
        csvValue: (row) => row.orderCount,
        render: (row) => formatNumber(row.orderCount),
        align: "right",
      },
      {
        key: "pendingCount",
        header: "Pending / unpaid",
        sortValue: (row) => row.pendingCount,
        csvValue: (row) => row.pendingCount,
        render: (row) => formatNumber(row.pendingCount),
        align: "right",
      },
      {
        key: "failedCount",
        header: "Failed",
        sortValue: (row) => row.failedCount,
        csvValue: (row) => row.failedCount,
        render: (row) => formatNumber(row.failedCount),
        align: "right",
      },
      {
        key: "pendingRate",
        header: "Pending rate",
        sortValue: (row) => row.pendingRate,
        csvValue: (row) => row.pendingRate,
        render: (row) => formatPercent(row.pendingRate),
        align: "right",
      },
    ],
    [],
  );

  const discountColumns = useMemo<ReportColumn<DiscountReportRow>[]>(
    () => [
      {
        key: "code",
        header: "Coupon / code",
        searchValue: (row) => row.code,
        sortValue: (row) => row.code,
        csvValue: (row) => row.code,
        render: (row) => row.code,
      },
      {
        key: "orders",
        header: "Orders",
        sortValue: (row) => row.orders,
        csvValue: (row) => row.orders,
        render: (row) => formatNumber(row.orders),
        align: "right",
      },
      {
        key: "grossRevenue",
        header: "Gross revenue",
        sortValue: (row) => row.grossRevenue,
        csvValue: (row) => row.grossRevenue,
        render: (row) => formatPrice(row.grossRevenue),
        align: "right",
      },
      {
        key: "discount",
        header: "Discount",
        sortValue: (row) => row.discount,
        csvValue: (row) => row.discount,
        render: (row) => formatPrice(row.discount),
        align: "right",
      },
      {
        key: "revenueAfterDiscount",
        header: "After discount",
        sortValue: (row) => row.revenueAfterDiscount,
        csvValue: (row) => row.revenueAfterDiscount,
        render: (row) => formatPrice(row.revenueAfterDiscount),
        align: "right",
      },
      {
        key: "averageDiscountPerOrder",
        header: "Avg discount",
        sortValue: (row) => row.averageDiscountPerOrder,
        csvValue: (row) => row.averageDiscountPerOrder,
        render: (row) => formatPrice(row.averageDiscountPerOrder),
        align: "right",
      },
    ],
    [],
  );

  const reportTabs: Array<{
    key: ReportKey;
    label: string;
    icon: React.ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
  }> = [
    { key: "products", label: "Products", icon: Boxes },
    { key: "locations", label: "Locations", icon: MapPin },
    { key: "payments", label: "Payments", icon: CreditCard },
    { key: "discounts", label: "Discounts", icon: Percent },
  ];
  const exportFilename = data?.dateRange
    ? buildAnalyticsExportFilename(activeReport, data.dateRange)
    : undefined;

  const reportTable =
    activeReport === "products" ? (
      <ReportTable
        title="Product drilldown"
        description="Product movement, revenue, order coverage, and sales status."
        rows={reportData?.products ?? []}
        columns={productColumns}
        rowKey={(row) => row.productId}
        emptyMessage="No product activity for this range."
        searchPlaceholder="Search products or status"
        initialSortKey="revenue"
        visibleColumnKeys={visibleColumnPreferences.products}
        onVisibleColumnKeysChange={(keys) =>
          handleVisibleColumnsChange("products", keys)
        }
        exportFilename={exportFilename}
      />
    ) : activeReport === "locations" ? (
      <ReportTable
        title="Location drilldown"
        description="Demand by county or city with delivery fees and delivery mix."
        rows={reportData?.locations ?? []}
        columns={locationColumns}
        rowKey={(row) => row.location}
        emptyMessage="No location demand for this range."
        searchPlaceholder="Search locations or delivery type"
        initialSortKey="orders"
        visibleColumnKeys={visibleColumnPreferences.locations}
        onVisibleColumnKeysChange={(keys) =>
          handleVisibleColumnsChange("locations", keys)
        }
        exportFilename={exportFilename}
      />
    ) : activeReport === "payments" ? (
      <ReportTable
        title="Payment drilldown"
        description="Payment collection and unpaid or failed order pressure by method."
        rows={reportData?.payments ?? []}
        columns={paymentColumns}
        rowKey={(row) => row.method}
        emptyMessage="No payment activity for this range."
        searchPlaceholder="Search payment methods"
        initialSortKey="orderCount"
        visibleColumnKeys={visibleColumnPreferences.payments}
        onVisibleColumnKeysChange={(keys) =>
          handleVisibleColumnsChange("payments", keys)
        }
        exportFilename={exportFilename}
      />
    ) : (
      <ReportTable
        title="Discount drilldown"
        description="Coupon usage, discount value, and revenue retained after discounts."
        rows={reportData?.discounts ?? []}
        columns={discountColumns}
        rowKey={(row) => row.code}
        emptyMessage="No coupon discounts for this range."
        searchPlaceholder="Search coupon codes"
        initialSortKey="discount"
        visibleColumnKeys={visibleColumnPreferences.discounts}
        onVisibleColumnKeysChange={(keys) =>
          handleVisibleColumnsChange("discounts", keys)
        }
        exportFilename={exportFilename}
      />
    );

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="Sales performance, payment mix, and location demand."
        action={
          <DateRangeControls
            value={range}
            loading={loading}
            onChange={handleRangeChange}
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

          <section
            className={styles.reportShell}
            aria-label="Analytics reports"
          >
            <div className={styles.reportTabs} role="tablist">
              {reportTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={activeReport === tab.key}
                    className={`${styles.reportTab} ${
                      activeReport === tab.key ? styles.reportTabActive : ""
                    }`}
                    onClick={() => handleReportChange(tab.key)}
                  >
                    <Icon size={15} aria-hidden />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {reportsError ? (
              <ErrorState
                message={reportsError}
                onRetry={() => setRefreshNonce((current) => current + 1)}
              />
            ) : reportsLoading && !reportData ? (
              <LoadingState />
            ) : (
              reportTable
            )}
          </section>
        </>
      )}
    </>
  );
}
