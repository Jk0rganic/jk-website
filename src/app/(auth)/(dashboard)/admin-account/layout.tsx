import { redirect } from "next/navigation";
import { fetchAdminOrders } from "@/lib/admin/fetch-admin-orders";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { getAdminSignInUrl } from "@/lib/auth/admin-login";
import AccountProvider from "../(resources)/dashboard-utils/account-context";
import AdminShell from "./components/shell/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status, session } = await requireAdminSession();

  if (status === 401) {
    redirect(getAdminSignInUrl());
  }

  if (status === 403 || !session) {
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
