"use client";

import { Bell, Menu, Moon, Search, Store, Sun } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getAdminPageTitle } from "./admin-nav";
import k from "./admin-topbar.module.scss";

type AdminTopbarProps = {
  pathname: string;
  onMenuClick: () => void;
};

const pageDescriptions: Record<string, string> = {
  "/admin-account": "Your store performance at a glance",
  "/admin-account/orders": "Track and fulfill customer orders",
  "/admin-account/products": "Manage catalog and inventory",
  "/admin-account/coupons": "Create and manage discount codes",
  "/admin-account/payments": "M-Pesa payment activity",
  "/admin-account/customers": "Everyone who has shopped at JK Organics",
  "/admin-account/reviews": "What customers are saying about your products",
  "/admin-account/team": "Invite and manage store admins",
  "/admin-account/details": "Your account settings",
};

function getDescription(pathname: string) {
  if (pageDescriptions[pathname]) return pageDescriptions[pathname];
  if (pathname.includes("/products/")) return "Update product details";
  if (pathname.includes("/orders/")) return "Review order and update status";
  return "JK Organics store management";
}

export default function AdminTopbar({
  pathname,
  onMenuClick,
}: AdminTopbarProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    document.documentElement.dataset.adminTheme = theme;
    return () => {
      delete document.documentElement.dataset.adminTheme;
    };
  }, [theme]);

  const isDark = theme === "dark";

  return (
    <header className={k.topbar}>
      <div className={k.left}>
        <button
          type="button"
          className={k.menuBtn}
          aria-label="Open menu"
          onClick={onMenuClick}
        >
          <Menu size={20} />
        </button>
        <div className={k.titleWrap}>
          <h1>{getAdminPageTitle(pathname)}</h1>
          <p>{getDescription(pathname)}</p>
        </div>
      </div>

      <div className={k.right}>
        <label className={k.searchBox}>
          <Search size={17} />
          <input
            type="search"
            placeholder="Search orders, products, customers..."
          />
          <kbd>⌘K</kbd>
        </label>

        <button
          type="button"
          className={k.iconBtn}
          aria-label="Toggle theme"
          title="Toggle theme"
          onClick={() => setTheme(isDark ? "light" : "dark")}
        >
          {isDark ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        <button
          type="button"
          className={k.iconBtn}
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={18} />
          <span className={k.notificationDot} />
        </button>

        <Link href="/" className={k.storeLink} target="_blank">
          <Store size={16} />
          <span>View store</span>
        </Link>
      </div>
    </header>
  );
}
