import { fetchWoo } from "@/lib/fetch/fetchRest";

export type CustomerStatus = "vip" | "active" | "new" | "dormant";

export type AdminCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  orders: number;
  spend: number;
  lastOrder: string | null;
  status: CustomerStatus;
};

export type CustomerDirectory = {
  customers: AdminCustomer[];
  summary: {
    total: number;
    newThisMonth: number;
    returningRate: number;
    averageLifetimeSpend: number;
  };
};

type WooCustomer = {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  date_created: string;
  billing?: WooBilling;
};
type WooBilling = {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  city?: string;
  state?: string;
};
type WooOrder = {
  id: number;
  status: string;
  total: string;
  date_created: string;
  customer_id: number;
  billing?: WooBilling;
};

const excludedStatuses = new Set(["cancelled", "failed", "refunded", "trash"]);

function emailKey(email?: string) {
  return email?.trim().toLowerCase() || "";
}
function fullName(billing?: WooBilling) {
  return [billing?.first_name, billing?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
}
function location(billing?: WooBilling) {
  return (
    [billing?.city, billing?.state].filter(Boolean).join(" - ") ||
    "Not provided"
  );
}
function sameMonth(value: string | null, now: Date) {
  if (!value) return false;
  const date = new Date(value);
  return (
    date.getUTCFullYear() === now.getUTCFullYear() &&
    date.getUTCMonth() === now.getUTCMonth()
  );
}
function statusFor(
  firstSeen: string,
  lastOrder: string | null,
  spend: number,
  now: Date,
): CustomerStatus {
  if (sameMonth(firstSeen, now)) return "new";
  if (spend >= 25_000) return "vip";
  if (
    lastOrder &&
    now.getTime() - new Date(lastOrder).getTime() <= 90 * 86_400_000
  )
    return "active";
  return "dormant";
}

export function buildCustomerDirectory(
  registered: WooCustomer[],
  orders: WooOrder[],
  now = new Date(),
): CustomerDirectory {
  type Mutable = {
    id: string;
    name: string;
    email: string;
    phone: string;
    location: string;
    orders: number;
    spend: number;
    lastOrder: string | null;
    firstSeen: string;
  };
  const byEmail = new Map<string, Mutable>();

  for (const customer of registered) {
    const email = emailKey(customer.email);
    if (!email) continue;
    byEmail.set(email, {
      id: String(customer.id),
      name:
        fullName({
          first_name: customer.first_name,
          last_name: customer.last_name,
        }) || email,
      email,
      phone: customer.billing?.phone || "Not provided",
      location: location(customer.billing),
      orders: 0,
      spend: 0,
      lastOrder: null,
      firstSeen: customer.date_created,
    });
  }

  for (const order of orders) {
    if (excludedStatuses.has(order.status)) continue;
    const email = emailKey(order.billing?.email);
    if (!email) continue;
    const existing = byEmail.get(email);
    const entry = existing ?? {
      id: order.customer_id ? String(order.customer_id) : `guest:${email}`,
      name: fullName(order.billing) || email,
      email,
      phone: order.billing?.phone || "Not provided",
      location: location(order.billing),
      orders: 0,
      spend: 0,
      lastOrder: null,
      firstSeen: order.date_created,
    };
    entry.name = fullName(order.billing) || entry.name;
    entry.phone = order.billing?.phone || entry.phone;
    entry.location =
      location(order.billing) === "Not provided"
        ? entry.location
        : location(order.billing);
    entry.orders += 1;
    entry.spend += Number.parseFloat(order.total) || 0;
    if (
      !entry.lastOrder ||
      new Date(order.date_created) > new Date(entry.lastOrder)
    )
      entry.lastOrder = order.date_created;
    if (new Date(order.date_created) < new Date(entry.firstSeen))
      entry.firstSeen = order.date_created;
    byEmail.set(email, entry);
  }

  const entries = [...byEmail.values()];
  const customers = entries
    .map(({ firstSeen, ...customer }) => ({
      ...customer,
      status: statusFor(firstSeen, customer.lastOrder, customer.spend, now),
    }))
    .sort((a, b) => (b.lastOrder || "").localeCompare(a.lastOrder || ""));
  const totalSpend = customers.reduce(
    (sum, customer) => sum + customer.spend,
    0,
  );
  return {
    customers,
    summary: {
      total: customers.length,
      newThisMonth: entries.filter((customer) =>
        sameMonth(customer.firstSeen, now),
      ).length,
      returningRate: customers.length
        ? Math.round(
            (customers.filter((customer) => customer.orders > 1).length /
              customers.length) *
              100,
          )
        : 0,
      averageLifetimeSpend: customers.length
        ? Math.round(totalSpend / customers.length)
        : 0,
    },
  };
}

async function fetchAll<T>(resource: "customers" | "orders") {
  const all: T[] = [];
  for (let page = 1; ; page += 1) {
    const suffix = resource === "orders" ? "&status=any" : "";
    const batch = await fetchWoo<T[]>(
      `${resource}?per_page=100&page=${page}${suffix}`,
      { noCache: true },
    );
    all.push(...batch);
    if (batch.length < 100) return all;
  }
}

export async function fetchAdminCustomers(now = new Date()) {
  const [customers, orders] = await Promise.all([
    fetchAll<WooCustomer>("customers"),
    fetchAll<WooOrder>("orders"),
  ]);
  return buildCustomerDirectory(customers, orders, now);
}
