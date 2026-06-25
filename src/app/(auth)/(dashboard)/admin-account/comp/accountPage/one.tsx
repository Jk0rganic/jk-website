"use client";

import { Trophy, ShoppingCart, Package } from "lucide-react";
import k from "./styles.module.scss";
import { formatPrice } from "@/utils/format-price";
import PercentageChange from "../percentage-change/percentage-change";
import { useMemo } from "react";
import { computeWeeklyComparison } from "@/lib/admin/admin-stats";

interface Props {
  orders: DashboardOrder[];
}

export default function One({ orders }: Props) {
  const size = 24;

  const { thisWeek, lastWeek } = useMemo(
    () => computeWeeklyComparison(orders),
    [orders],
  );

  const cardData = [
    {
      title: "total sales amount",
      icon: <Trophy size={size} />,
      value: formatPrice(thisWeek.sales),
      current: thisWeek.sales,
      previous: lastWeek.sales,
    },
    {
      title: "total orders",
      icon: <Package size={size} />,
      value: thisWeek.orders,
      current: thisWeek.orders,
      previous: lastWeek.orders,
    },
    {
      title: "total products",
      icon: <ShoppingCart size={size} />,
      value: thisWeek.products,
      current: thisWeek.products,
      previous: lastWeek.products,
    },
  ];

  return (
    <div className={k.one}>
      {cardData.map((item, index) => (
        <div key={index} className={k.card}>
          <h2>
            {item.icon} {item.title}
          </h2>

          <h3>{item.value}</h3>

          <PercentageChange
            current={item.current}
            previous={item.previous}
            label="last week"
          />
        </div>
      ))}
    </div>
  );
}
