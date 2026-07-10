"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  computeMonthlyChartData,
  computeYearOverYearGrowth,
  getOrderYears,
} from "@/lib/admin/admin-stats";
import { formatPrice } from "@/utils/format-price";
import k from "./styles.module.scss";

interface Props {
  orders: DashboardOrder[];
  height?: number;
}

type HoverKey = "revenue" | "orders" | null;
type LegendEntry = {
  dataKey?: string | number;
};

export default function OrdersChart({ orders = [], height = 320 }: Props) {
  const [hoveringKey, setHoveringKey] = useState<HoverKey>(null);
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );

  const years = useMemo(
    () => getOrderYears(orders, new Date().getFullYear()),
    [orders],
  );

  const data = useMemo(
    () => computeMonthlyChartData(orders, selectedYear),
    [orders, selectedYear],
  );

  const { currentYearTotal, percentage, isUp } = useMemo(
    () => computeYearOverYearGrowth(orders, selectedYear),
    [orders, selectedYear],
  );

  return (
    <div className={k.two}>
      {/* TOP */}
      <div className={k.top}>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        <div className={k.statistic}>
          <h4>Sales statistics</h4>
          <h5>
            <span className={k.price}>{formatPrice(currentYearTotal)}</span>

            <span className={isUp ? k.up : k.down}>
              {isUp ? "+" : "-"} {Math.abs(percentage).toFixed(1)}%
            </span>
          </h5>
        </div>
      </div>

      {/* CHART */}
      <div style={{ width: "100%", minWidth: 0, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="month" />
            <YAxis />

            <Tooltip labelFormatter={(month) => month} />

            <Legend
              onMouseEnter={(entry: LegendEntry) => {
                setHoveringKey(
                  entry.dataKey === "revenue" || entry.dataKey === "orders"
                    ? entry.dataKey
                    : null,
                );
              }}
              onMouseLeave={() => setHoveringKey(null)}
            />

            <Line
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#8884d8"
              strokeOpacity={hoveringKey === "orders" ? 0.4 : 1}
            />

            <Line
              type="monotone"
              dataKey="orders"
              name="Orders"
              stroke="#82ca9d"
              strokeOpacity={hoveringKey === "revenue" ? 0.4 : 1}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="notes">Tip: Hover the legend</p>
    </div>
  );
}
