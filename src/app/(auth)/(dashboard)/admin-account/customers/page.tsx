"use client";

import { useMemo, useState } from "react";
import ui from "../components/ui/admin-ui.module.scss";
import { PageHeader } from "../components/ui/page-header";
import k from "./styles.module.scss";

type CustomerStatus = "vip" | "active" | "new" | "dormant";

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  orders: number;
  spend: number;
  lastOrder: string;
  status: CustomerStatus;
  blocked: boolean;
};

type CustomerAction = "reset" | "block" | "delete";

type PendingAction = {
  type: CustomerAction;
  customer: Customer;
};

const initialCustomers: Customer[] = [
  {
    id: "c1",
    name: "Amina Yusuf",
    email: "amina.y@gmail.com",
    phone: "+254 712 345 678",
    location: "Nairobi - Westlands",
    orders: 21,
    spend: 48_200,
    lastOrder: "Jul 8, 2026",
    status: "vip",
    blocked: false,
  },
  {
    id: "c2",
    name: "Peter Otieno",
    email: "p.otieno@gmail.com",
    phone: "+254 733 221 019",
    location: "Kisumu - CBD",
    orders: 17,
    spend: 39_600,
    lastOrder: "Jul 8, 2026",
    status: "active",
    blocked: false,
  },
  {
    id: "c3",
    name: "Grace Wanjiru",
    email: "gracew@yahoo.com",
    phone: "+254 701 556 233",
    location: "Nairobi - Kilimani",
    orders: 14,
    spend: 33_100,
    lastOrder: "Jul 7, 2026",
    status: "active",
    blocked: false,
  },
  {
    id: "c4",
    name: "David Kamau",
    email: "dkamau@gmail.com",
    phone: "+254 720 908 771",
    location: "Nakuru - Milimani",
    orders: 12,
    spend: 28_450,
    lastOrder: "Jul 7, 2026",
    status: "active",
    blocked: false,
  },
  {
    id: "c5",
    name: "Fatuma Ali",
    email: "fatuma.ali@gmail.com",
    phone: "+254 711 334 552",
    location: "Mombasa - Nyali",
    orders: 10,
    spend: 24_900,
    lastOrder: "Jul 6, 2026",
    status: "active",
    blocked: false,
  },
  {
    id: "c6",
    name: "John Mwangi",
    email: "jmwangi@gmail.com",
    phone: "+254 799 120 448",
    location: "Nairobi - Westlands",
    orders: 6,
    spend: 14_200,
    lastOrder: "Jul 6, 2026",
    status: "active",
    blocked: false,
  },
  {
    id: "c7",
    name: "Mary Achieng",
    email: "machieng@gmail.com",
    phone: "+254 715 667 201",
    location: "Kisumu - CBD",
    orders: 2,
    spend: 3_900,
    lastOrder: "Jun 28, 2026",
    status: "new",
    blocked: false,
  },
  {
    id: "c8",
    name: "Samuel Kiptoo",
    email: "skiptoo@gmail.com",
    phone: "+254 722 445 108",
    location: "Eldoret - Town",
    orders: 1,
    spend: 1_650,
    lastOrder: "Mar 14, 2026",
    status: "dormant",
    blocked: false,
  },
];

const customerStats = [
  { label: "Total customers", value: "1,284" },
  { label: "New this month", value: "96" },
  { label: "Returning rate", value: "62%" },
  { label: "Avg. lifetime spend", value: "KES 18,600" },
];

const statusOptions = ["All customers", "VIP", "Active", "New", "Dormant"];
const locationOptions = [
  "All locations",
  "Nairobi",
  "Mombasa",
  "Kisumu",
  "Nakuru",
];

function formatKes(amount: number) {
  return `KES ${amount.toLocaleString("en-KE")}`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getStatusLabel(customer: Customer) {
  if (customer.blocked) {
    return "Blocked";
  }

  return customer.status === "vip"
    ? "VIP"
    : customer.status.charAt(0).toUpperCase() + customer.status.slice(1);
}

function getStatusClass(customer: Customer) {
  if (customer.blocked) {
    return ui.badgeRed;
  }

  if (customer.status === "vip") {
    return ui.badgeViolet;
  }

  if (customer.status === "new") {
    return k.badgeBlue;
  }

  if (customer.status === "dormant") {
    return ui.badgeGray;
  }

  return ui.badgeGreen;
}

function getActionCopy(action: PendingAction) {
  const { customer } = action;

  if (action.type === "reset") {
    return {
      title: "Send password reset?",
      body: `A password reset link will be emailed to ${customer.name}. Their current password stays active until they set a new one.`,
      verb: "Send reset link",
      danger: false,
    };
  }

  if (action.type === "delete") {
    return {
      title: "Delete customer?",
      body: `${customer.name}'s account and order history reference will be permanently removed. This cannot be undone.`,
      verb: "Delete",
      danger: true,
    };
  }

  return {
    title: customer.blocked ? "Unblock customer?" : "Block customer?",
    body: customer.blocked
      ? `${customer.name} will regain the ability to sign in and place orders.`
      : `${customer.name} will be signed out and blocked from signing in or ordering until unblocked.`,
    verb: customer.blocked ? "Unblock" : "Block",
    danger: !customer.blocked,
  };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All customers");
  const [location, setLocation] = useState("All locations");
  const [resetSent, setResetSent] = useState<Record<string, boolean>>({});
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );

  const filteredCustomers = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesSearch =
        !needle ||
        [customer.name, customer.email, customer.phone, customer.location]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      const matchesStatus =
        status === "All customers" || getStatusLabel(customer) === status;
      const matchesLocation =
        location === "All locations" || customer.location.startsWith(location);

      return matchesSearch && matchesStatus && matchesLocation;
    });
  }, [customers, location, search, status]);

  function confirmAction() {
    if (!pendingAction) {
      return;
    }

    const { customer, type } = pendingAction;

    if (type === "reset") {
      setResetSent((current) => ({ ...current, [customer.id]: true }));
    }

    if (type === "block") {
      setCustomers((current) =>
        current.map((item) =>
          item.id === customer.id ? { ...item, blocked: !item.blocked } : item,
        ),
      );
    }

    if (type === "delete") {
      setCustomers((current) =>
        current.filter((item) => item.id !== customer.id),
      );
    }

    setPendingAction(null);
  }

  const modalCopy = pendingAction ? getActionCopy(pendingAction) : null;

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="Everyone who has shopped at JK Organics."
      />

      <div className={k.page}>
        <div className={ui.statGrid}>
          {customerStats.map((stat) => (
            <article className={ui.statCard} key={stat.label}>
              <span className={ui.statLabel}>{stat.label}</span>
              <strong className={ui.statValue}>{stat.value}</strong>
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

            <label className={k.selectField}>
              <span>Location</span>
              <select
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              >
                {locationOptions.map((option) => (
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr
                    className={customer.blocked ? k.blockedRow : undefined}
                    key={customer.id}
                  >
                    <td>
                      <div className={k.customerCell}>
                        <span className={k.avatar}>
                          {getInitials(customer.name)}
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
                    <td>{customer.lastOrder}</td>
                    <td>
                      <span
                        className={`${ui.badge} ${getStatusClass(customer)}`}
                      >
                        {getStatusLabel(customer)}
                      </span>
                    </td>
                    <td>
                      <div className={k.actions}>
                        <button
                          type="button"
                          className={`${k.actionBtn} ${
                            resetSent[customer.id] ? k.successBtn : ""
                          }`}
                          onClick={() =>
                            setPendingAction({ type: "reset", customer })
                          }
                        >
                          {resetSent[customer.id] ? "Sent" : "Reset password"}
                        </button>
                        <button
                          type="button"
                          className={`${k.actionBtn} ${k.warnBtn}`}
                          onClick={() =>
                            setPendingAction({ type: "block", customer })
                          }
                        >
                          {customer.blocked
                            ? "Unblock customer"
                            : "Block customer"}
                        </button>
                        <button
                          type="button"
                          className={k.dangerBtn}
                          onClick={() =>
                            setPendingAction({ type: "delete", customer })
                          }
                        >
                          Delete customer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCustomers.length === 0 && (
            <p className={ui.empty}>No customers match these filters.</p>
          )}
        </section>
      </div>

      {pendingAction && modalCopy && (
        <div className={k.modalBackdrop}>
          <div
            aria-labelledby="customer-action-title"
            aria-modal="true"
            className={k.modal}
            role="dialog"
          >
            <h2 id="customer-action-title">{modalCopy.title}</h2>
            <p>{modalCopy.body}</p>
            <div className={k.modalActions}>
              <button
                type="button"
                className={k.actionBtn}
                onClick={() => setPendingAction(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={modalCopy.danger ? k.confirmDanger : ui.btnAccent}
                onClick={confirmAction}
              >
                {modalCopy.verb}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
