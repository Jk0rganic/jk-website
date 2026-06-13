"use client";

import { Trophy, ShoppingCart, Package } from "lucide-react";
import k from "./styles.module.scss";
import { formatPrice } from "@/utils/format-price";
import PercentageChange from "../percentage-change/percentage-change";
import { useMemo } from "react";

interface DashboardOrderItem {
  quantity: number;
}

interface DashboardOrder {
  total: string;
  date_created: string;
  line_items?: DashboardOrderItem[];
}

interface Props {
  orders: DashboardOrder[];
}

export default function One({ orders }: Props) {
  const size = 24;

  const { thisWeek, lastWeek } = useMemo(() => {
    const now = new Date();

    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - 7);

    const startOfLastWeek = new Date(now);
    startOfLastWeek.setDate(now.getDate() - 14);

    const safeOrders = (orders || []).map((order) => ({
      ...order,
      total: Number(order.total || 0),
      date: new Date(order.date_created),
    }));

    const thisWeekSales = safeOrders
      .filter((o) => o.date >= startOfThisWeek && o.date <= now)
      .reduce((sum, o) => sum + o.total, 0);

    const lastWeekSales = safeOrders
      .filter((o) => o.date >= startOfLastWeek && o.date < startOfThisWeek)
      .reduce((sum, o) => sum + o.total, 0);

    const thisWeekOrders = safeOrders.filter(
      (o) => o.date >= startOfThisWeek && o.date <= now,
    ).length;

    const lastWeekOrders = safeOrders.filter(
      (o) => o.date >= startOfLastWeek && o.date < startOfThisWeek,
    ).length;

    const getProductsTotal = (from: Date, to: Date) =>
      safeOrders
        .filter((o) => o.date >= from && o.date < to)
        .reduce((sum, order) => {
          const items = order.line_items ?? [];

          const qty = items.reduce(
            (itemSum, item) => itemSum + (item.quantity || 0),
            0,
          );

          return sum + qty;
        }, 0);

    const thisWeekProducts = getProductsTotal(startOfThisWeek, now);
    const lastWeekProducts = getProductsTotal(startOfLastWeek, startOfThisWeek);

    return {
      thisWeek: {
        sales: thisWeekSales,
        orders: thisWeekOrders,
        products: thisWeekProducts,
      },
      lastWeek: {
        sales: lastWeekSales,
        orders: lastWeekOrders,
        products: lastWeekProducts,
      },
    };
  }, [orders]);

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
