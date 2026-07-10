import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CreditCard,
  LayoutDashboard,
  MessageSquareText,
  Package,
  Settings,
  ShoppingBag,
  Ticket,
  UserRound,
  Users,
} from "lucide-react";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  superAdminOnly?: boolean;
};

export type AdminNavGroup = {
  title: string;
  items: AdminNavItem[];
};

export const adminNavGroups: AdminNavGroup[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/admin-account", icon: LayoutDashboard },
    ],
  },
  {
    title: "Fulfillment",
    items: [
      { label: "Orders", href: "/admin-account/orders", icon: ShoppingBag },
      { label: "Payments", href: "/admin-account/payments", icon: CreditCard },
    ],
  },
  {
    title: "Catalog",
    items: [
      { label: "Products", href: "/admin-account/products", icon: Package },
      { label: "Coupons", href: "/admin-account/coupons", icon: Ticket },
      {
        label: "Reviews",
        href: "/admin-account/reviews",
        icon: MessageSquareText,
      },
    ],
  },
  {
    title: "Customers",
    items: [
      {
        label: "Customers",
        href: "/admin-account/customers",
        icon: UserRound,
        superAdminOnly: true,
      },
    ],
  },
  {
    title: "Growth",
    items: [
      { label: "Analytics", href: "/admin-account/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Team",
    items: [
      {
        label: "Admins",
        href: "/admin-account/team",
        icon: Users,
        superAdminOnly: true,
      },
    ],
  },
  {
    title: "Settings",
    items: [
      {
        label: "Account",
        href: "/admin-account/details",
        icon: Settings,
      },
    ],
  },
];

export const adminPageTitles: Record<string, string> = {
  "/admin-account": "Dashboard",
  "/admin-account/analytics": "Analytics",
  "/admin-account/orders": "Orders",
  "/admin-account/customers": "Customers",
  "/admin-account/products": "Products",
  "/admin-account/products/new": "Add product",
  "/admin-account/coupons": "Coupons",
  "/admin-account/coupons/new": "Create coupon",
  "/admin-account/payments": "Payments",
  "/admin-account/reviews": "Reviews",
  "/admin-account/team": "Admins",
  "/admin-account/details": "Account",
};

export function getAdminPageTitle(pathname: string): string {
  if (adminPageTitles[pathname]) {
    return adminPageTitles[pathname];
  }

  if (pathname.startsWith("/admin-account/products/")) {
    return "Edit product";
  }

  if (pathname.startsWith("/admin-account/coupons/")) {
    return "Edit coupon";
  }

  if (pathname.startsWith("/admin-account/orders/")) {
    return "Order details";
  }

  return "Admin";
}
