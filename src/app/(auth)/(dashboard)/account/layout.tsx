import { redirect } from "next/navigation";
import Section from "@/comp/section/section";
import { isAdminRole } from "@/lib/admin/roles";
import { getSession } from "@/lib/auth/getSession";
import { fetchWoo } from "@/lib/fetch/fetchRest";
import AccountSidebar from "../(resources)/dashboard-comp/account-sidebar/account-sidebar";
import AccountProvider from "../(resources)/dashboard-utils/account-context";
import k from "./styles.module.scss";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/auth/signin");
  } else if (isAdminRole(session.user.role)) {
    redirect("/admin-account");
  } else if (session.user.role !== "user") {
    redirect("/");
  }

  const customerId = session?.user?.email;

  let orders: DashboardOrder[] = [];
  if (customerId) {
    orders = await fetchWoo(
      `orders?search=${customerId}&orderby=date&order=desc`,
    );
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
