import type { LucideIcon } from "lucide-react";
import {
  CreditCard,
  LayoutDashboard,
  MessageSquareText,
  Package,
  Settings,
  ShoppingBag,
  Ticket,
  Truck,
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
    title: "Store",
    items: [
      { label: "Orders", href: "/admin-account/orders", icon: ShoppingBag },
      { label: "Products", href: "/admin-account/products", icon: Package },
      { label: "Coupons", href: "/admin-account/coupons", icon: Ticket },
      { label: "Payments", href: "/admin-account/payments", icon: CreditCard },
      { label: "Delivery fees", href: "/admin-account/delivery", icon: Truck },
      {
        label: "Customers",
        href: "/admin-account/customers",
        icon: UserRound,
        superAdminOnly: true,
      },
      {
        label: "Reviews",
        href: "/admin-account/reviews",
        icon: MessageSquareText,
      },
    ],
  },
  {
    title: "Settings",
    items: [
      {
        label: "Team",
        href: "/admin-account/team",
        icon: Users,
        superAdminOnly: true,
      },
      {
        label: "Profile",
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
  "/admin-account/delivery": "Delivery fees",
  "/admin-account/products": "Products",
  "/admin-account/products/new": "Add product",
  "/admin-account/coupons": "Coupons",
  "/admin-account/coupons/new": "Create coupon",
  "/admin-account/payments": "Payments",
  "/admin-account/reviews": "Reviews",
  "/admin-account/team": "Team",
  "/admin-account/details": "Profile",
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
