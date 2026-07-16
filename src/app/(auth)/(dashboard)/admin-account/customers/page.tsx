"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  AdminCustomer,
  CustomerDirectory,
} from "@/lib/admin/customer-service";
import ui from "../components/ui/admin-ui.module.scss";
import { PageHeader } from "../components/ui/page-header";
import k from "./styles.module.scss";

const statusOptions = ["All customers", "VIP", "Active", "New", "Dormant"];
const statusLabel = (customer: AdminCustomer) =>
  customer.status === "vip"
    ? "VIP"
    : customer.status[0].toUpperCase() + customer.status.slice(1);
const formatKes = (amount: number) => `KES ${amount.toLocaleString("en-KE")}`;
const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
const formatDate = (date: string | null) =>
  date
    ? new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(
        new Date(date),
      )
    : "No orders yet";
const statusClass = (customer: AdminCustomer) =>
  customer.status === "vip"
    ? ui.badgeViolet
    : customer.status === "new"
      ? k.badgeBlue
      : customer.status === "dormant"
        ? ui.badgeGray
        : ui.badgeGreen;

export default function CustomersPage() {
  const [data, setData] = useState<CustomerDirectory | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All customers");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/customers", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load customers");
        return response.json() as Promise<CustomerDirectory>;
      })
      .then(setData)
      .catch((reason) => {
        if (reason.name !== "AbortError") setError(reason.message);
      });
    return () => controller.abort();
  }, []);

  const filtered = useMemo(
    () =>
      (data?.customers ?? []).filter((customer) => {
        const needle = search.trim().toLowerCase();
        const matchesSearch =
          !needle ||
          [customer.name, customer.email, customer.phone, customer.location]
            .join(" ")
            .toLowerCase()
            .includes(needle);
        return (
          matchesSearch &&
          (status === "All customers" || statusLabel(customer) === status)
        );
      }),
    [data, search, status],
  );

  const stats = data
    ? [
        ["Total customers", data.summary.total.toLocaleString("en-KE")],
        ["New this month", data.summary.newThisMonth.toLocaleString("en-KE")],
        ["Returning rate", `${data.summary.returningRate}%`],
        ["Avg. lifetime spend", formatKes(data.summary.averageLifetimeSpend)],
      ]
    : [];

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="Live customer and purchase data from WooCommerce."
      />
      <div className={k.page}>
        {error && (
          <p className={ui.empty} role="alert">
            {error}. Please try again.
          </p>
        )}
        {!data && !error && <p className={ui.empty}>Loading customers…</p>}
        {data && (
          <>
            <div className={ui.statGrid}>
              {stats.map(([label, value]) => (
                <article className={ui.statCard} key={label}>
                  <span className={ui.statLabel}>{label}</span>
                  <strong className={ui.statValue}>{value}</strong>
                </article>
              ))}
            </div>
            <section className={k.panel}>
              <div className={k.toolbar}>
                <label className={k.searchField}>
                  <span className={k.srOnly}>Search customers</span>
                  <input
                    aria-label="Search customers"
                    type="search"
                    placeholder="Search name, email, phone..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
                <label className={k.selectField}>
                  <span>Status</span>
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                  >
                    {statusOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className={ui.tableWrap}>
                <table className={`${ui.table} ${k.table}`}>
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Phone</th>
                      <th>Location</th>
                      <th>Orders</th>
                      <th>Total spent</th>
                      <th>Last order</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((customer) => (
                      <tr key={customer.id}>
                        <td>
                          <div className={k.customerCell}>
                            <span className={k.avatar}>
                              {initials(customer.name)}
                            </span>
                            <span className={k.identity}>
                              <strong>{customer.name}</strong>
                              <small>{customer.email}</small>
                            </span>
                          </div>
                        </td>
                        <td>{customer.phone}</td>
                        <td>{customer.location}</td>
                        <td>
                          <strong>{customer.orders}</strong>
                        </td>
                        <td>
                          <strong>{formatKes(customer.spend)}</strong>
                        </td>
                        <td>{formatDate(customer.lastOrder)}</td>
                        <td>
                          <span
                            className={`${ui.badge} ${statusClass(customer)}`}
                          >
                            {statusLabel(customer)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filtered.length === 0 && (
                <p className={ui.empty}>
                  {data.customers.length
                    ? "No customers match these filters."
                    : "No customers have been recorded yet."}
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </>
  );
}
