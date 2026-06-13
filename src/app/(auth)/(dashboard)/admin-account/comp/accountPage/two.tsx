"use client";

import { formatPrice } from "@/utils/format-price";
import k from "./styles.module.scss";
import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Props {
  orders: DashboardOrder[];
}

type HoverKey = "revenue" | "orders" | null;

export default function OrdersChart({ orders = [] }: Props) {
  const [hoveringKey, setHoveringKey] = useState<HoverKey>(null);
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );

  // ---- SAFE YEARS ----
  const years = useMemo(() => {
    const set = new Set<number>();

    orders.forEach((order) => {
      set.add(new Date(order.date_created).getFullYear());
    });

    return Array.from(set).sort((a, b) => b - a);
  }, [orders]);

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // ---- MONTHLY DATA ----
  const data = useMemo(() => {
    const map = months.map((month) => ({
      month,
      revenue: 0,
      orders: 0,
      lastDate: null as Date | null,
    }));

    orders.forEach((order) => {
      const date = new Date(order.date_created);
      const year = date.getFullYear();

      if (year !== selectedYear) return;

      const monthIndex = date.getMonth();

      map[monthIndex].revenue += Number(order.total || 0);
      map[monthIndex].orders += 1;
      map[monthIndex].lastDate = date;
    });

    return map;
  }, [orders, selectedYear]);

  // ---- TOTALS ----
  const currentYearTotal = useMemo(
    () => data.reduce((sum, d) => sum + d.revenue, 0),
    [data],
  );

  const previousYearTotal = useMemo(() => {
    return orders
      .filter(
        (o) => new Date(o.date_created).getFullYear() === selectedYear - 1,
      )
      .reduce((sum, o) => sum + Number(o.total || 0), 0);
  }, [orders, selectedYear]);

  // ---- PERCENT ----
  let percentage = 0;

  if (previousYearTotal === 0 && currentYearTotal > 0) {
    percentage = 100;
  } else if (previousYearTotal !== 0) {
    percentage =
      ((currentYearTotal - previousYearTotal) / previousYearTotal) * 100;

    percentage = Math.max(-100, Math.min(100, percentage));
  }

  const isUp = percentage >= 0;

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
      <div style={{ width: "100%", height: 400 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="month" />
            <YAxis />

            <Tooltip labelFormatter={(month) => month} />

            <Legend
              onMouseEnter={(e: any) => setHoveringKey(e.dataKey)}
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
