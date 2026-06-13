"use client";

import k from "./styles.module.scss";
import React, { useMemo, useState } from "react";
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

interface TwoProps {
  orders: DashboardOrder[];
}

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-GB").format(new Date(date));

export default function Two({ orders }: TwoProps) {
  const [hoveringKey, setHoveringKey] = useState<string | null>(null);

  const data = useMemo(() => {
    const map: Record<string, { name: string; pv: number; uv: number }> = {};

    orders?.forEach((order) => {
      const date = formatDate(order.date_created);

      if (!map[date]) {
        map[date] = { name: date, pv: 0, uv: 0 };
      }

      map[date].pv += Number(order.total);
      map[date].uv += 1;
    });

    return Object.values(map);
  }, [orders]);

  return (
    <section className={k.two}>
      <div className={k.chart}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend
              onMouseEnter={(e: any) => setHoveringKey(e.dataKey)}
              onMouseLeave={() => setHoveringKey(null)}
            />

            <Line
              type="monotone"
              dataKey="pv"
              name="Revenue"
              stroke="#8884d8"
              strokeOpacity={hoveringKey === "uv" ? 0.4 : 1}
            />

            <Line
              type="monotone"
              dataKey="uv"
              name="Orders"
              stroke="#82ca9d"
              strokeOpacity={hoveringKey === "pv" ? 0.4 : 1}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className={k.notes}>Tip: Hover the legend</p>
    </section>
  );
}
