"use client";

import Link from "next/link";
import { Menu, Store } from "lucide-react";
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
        <Link href="/" className={k.storeLink} target="_blank">
          <Store size={16} />
          <span>View store</span>
        </Link>
      </div>
    </header>
  );
}
