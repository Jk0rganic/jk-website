import { getSession } from "@/lib/auth/getSession";
import { redirect } from "next/navigation";
import { fetchAdminOrders } from "@/lib/admin/fetch-admin-orders";
import { isAdminRole } from "@/lib/admin/roles";
import { getAdminSignInUrl } from "@/lib/auth/admin-login";
import AccountProvider from "../(resources)/dashboard-utils/account-context";
import AdminShell from "./components/shell/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect(getAdminSignInUrl());
  }

  if (!isAdminRole(session.user.role)) {
    redirect("/account");
  }

  let orders: DashboardOrder[] = [];

  try {
    orders = await fetchAdminOrders();
  } catch (error) {
    console.error("Failed to fetch admin orders:", error);
    orders = [];
  }

  return (
    <AdminShell user={session.user}>
      <AccountProvider session={session} orders={orders}>
        {children}
      </AccountProvider>
    </AdminShell>
  );
}
