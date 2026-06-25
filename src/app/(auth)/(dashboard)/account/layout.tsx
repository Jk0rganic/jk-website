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
  } else if (session.user.role === "min_admin" || session.user.role === "super_admin") {
    redirect("/admin-account");
  } else if (session.user.role !== "user") {
    redirect("/");
  }

  const customerId = session?.user?.email;

  let orders:   DashboardOrder[]= [];
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
