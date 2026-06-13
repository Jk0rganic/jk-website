import k from "./styles.module.scss";
import Section from "@/comp/section/section";
import { getSession } from "@/lib/auth/getSession";
import { fetchWoo } from "@/lib/fetch/fetchRest";
import { redirect } from "next/navigation";

import AccountProvider from "../(resources)/dashboard-utils/account-context";
import AccountSidebar from "../(resources)/dashboard-comp/account-sidebar/account-sidebar";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/auth/signin");
  }

  const user = session.user;

  const isAdmin = user.role === "min_admin";

  if (!isAdmin) {
    redirect("/account/dashboard");
  }

  let orders: DashboardOrder[] = [];

  try {
    if (user.email) {
      orders = await fetchWoo(
        `orders?customer=${encodeURIComponent(user.email)}`,
      );
    }
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    orders = [];
  }

  return (
    <Section className={k.account_container}>
      <AccountSidebar />

      <main className={k.account_content}>
        <AccountProvider session={session} orders={orders}>
          {children}
        </AccountProvider>
      </main>
    </Section>
  );
}
