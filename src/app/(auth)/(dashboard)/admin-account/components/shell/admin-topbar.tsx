"use client";

import Link from "next/link";
import { Menu, Plus, Search, Store } from "lucide-react";
import { getAdminPageTitle } from "./admin-nav";
import k from "./admin-topbar.module.scss";

type AdminTopbarProps = {
  pathname: string;
  onMenuClick: () => void;
};

const pageDescriptions: Record<string, string> = {
  "/admin-account": "Daily performance, urgent work, and growth signals",
  "/admin-account/orders": "Fulfill orders and track payment state",
  "/admin-account/payments": "Reconcile cash, M-Pesa, and pending payments",
  "/admin-account/products": "Manage catalog, pricing, and stock",
  "/admin-account/coupons": "Control discounts and promotional codes",
  "/admin-account/reviews": "Monitor customer feedback and product sentiment",
  "/admin-account/analytics":
    "Revenue, products, locations, payments, and discounts",
  "/admin-account/team": "Manage admin access and security",
  "/admin-account/details": "Admin account settings",
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
        <label className={k.search}>
          <Search size={16} aria-hidden="true" />
          <span className={k.searchLabel}>Search admin</span>
          <input type="search" placeholder="Search" aria-label="Search admin" />
        </label>
        <Link href="/admin-account/products/new" className={k.actionLink}>
          <Plus size={16} aria-hidden="true" />
          <span>New product</span>
        </Link>
        <Link href="/" className={k.storeLink} target="_blank" rel="noreferrer">
          <Store size={16} aria-hidden="true" />
          <span>View store</span>
        </Link>
      </div>
    </header>
  );
}
