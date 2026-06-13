"use client";

import { useAccount } from "../../../(resources)/dashboard-utils/account-context";
import One from "./one";
import Two from "./two";

export default function DashboardPageAdmin() {
  const { orders } = useAccount();

  return (
    <div>
      <One orders={orders} />
      <Two orders={orders} />
    </div>
  );
}
