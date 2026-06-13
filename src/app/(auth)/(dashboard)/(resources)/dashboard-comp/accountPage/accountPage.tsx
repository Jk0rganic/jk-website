"use client";

import { useAccount } from "../../dashboard-utils/account-context";

// import One from "./one";
// import Two from "./two";

export default function DashboardPage() {
  const { session } = useAccount();

  return (
    <div>
      {/* <One orders={orders} />
      <Two orders={orders} /> */}
      <h5>
        Welcome {session.user.name || session.user.email} to your dashboard
      </h5>
    </div>
  );
}
