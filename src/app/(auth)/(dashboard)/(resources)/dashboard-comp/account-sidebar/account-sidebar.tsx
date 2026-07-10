"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import DashLogout from "../dash-logout/dash-logout";
import k from "./styles.module.scss";

type Session = {
  user: {
    email: string;
    role: string;
    name?: string;
    image?: string;
  };
};

export default function AccountSidebar() {
  const [user, setUser] = useState<Session["user"] | null>(null);
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const userAdmin = user?.role === "min_admin" || user?.role === "super_admin";
  const userSuperAdmin = user?.role === "super_admin";
  const userUser = user?.role === "user";

  const menuItems = userAdmin
    ? [
        { label: "Dashboard", href: "/admin-account" },
        { label: "Orders", href: "/admin-account/orders" },
        { label: "Products", href: "/admin-account/products" },
        { label: "Payments", href: "/admin-account/payments" },
        ...(userSuperAdmin
          ? [{ label: "Team", href: "/admin-account/team" }]
          : []),
        { label: "Account details", href: "/admin-account/details" },
      ]
    : userUser
      ? [
          { label: "Dashboard", href: "/account" },
          { label: "Orders", href: "/account/orders" },
          { label: "Addresses", href: "/account/addresses" },
          { label: "Account details", href: "/account/details" },
        ]
      : [];
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/session");
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        console.error("Session fetch error:", err);
      }
    }

    fetchSession();
  }, []);

  return (
    <>
      <aside className={`${k.account_sidebar} ${menuOpen ? k.open : ""}`}>
        {/* Mobile toggle button */}
        <button
          type="button"
          className={k.menu_toggle}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle account menu"
        >
          ☰ Menu
        </button>

        {/* Menu list */}
        <ul onClick={() => setMenuOpen(false)}>
          {/* Account user */}
          <div className={k.account_user}>
            {user?.image ? (
              <Image
                className={k.avatar}
                src={user.image}
                alt={user.name || "User"}
                width={50}
                height={50}
              />
            ) : null}
            {user && <li>Welcome, {user.name || user.email}!</li>}
          </div>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href} className={isActive ? k.active : ""}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            );
          })}
          <li>
            <DashLogout />
          </li>
        </ul>
      </aside>
      {menuOpen && (
        <div className={k.overlay} onClick={() => setMenuOpen(false)}></div>
      )}
    </>
  );
}
