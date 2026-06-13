import { Trophy, ShoppingCart, Package } from "lucide-react";
import k from "./styles.module.scss";
import { formatPrice } from "@/utils/format-price";

export default function One({ orders }: { orders: DashboardOrder[] }) {
  const ordersWithTotal = orders.map((order) => ({
    ...order,
    total: Number(order.total || 0),
  }));

  // Total sales amount
  const totalSalesAmount = ordersWithTotal.reduce(
    (sum, order) => sum + order.total,
    0,
  );

  const totalOrders = orders.length;

  const totalProducts = ordersWithTotal.reduce(
    (sum, order) =>
      sum +
      order.line_items.reduce(
        (itemSum, item) => itemSum + (item.quantity || 0),
        0,
      ),
    0,
  );

  const size = 24;

  const cardData = [
    {
      title: "total sales amount",
      icon: <Trophy size={size} />,
      value: formatPrice(totalSalesAmount),
    },
    {
      title: "total orders",
      icon: <Package size={size} />,
      value: totalOrders,
    },
    {
      title: "total products",
      icon: <ShoppingCart size={size} />,
      value: totalProducts,
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
        </div>
      ))}
    </div>
  );
}
