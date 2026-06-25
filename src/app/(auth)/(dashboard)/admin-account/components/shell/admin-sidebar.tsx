"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { adminNavGroups } from "./admin-nav";
import { logoutTo } from "@/app/(auth)/auth/signup/comp/social_login/action";
import { ADMIN_SIGN_IN_PATH } from "@/lib/auth/admin-login";
import { getRoleLabel } from "@/lib/admin/roles";
import { BRAND_LOGO_URL } from "@/lib/brand";
import k from "./admin-sidebar.module.scss";

type AdminSidebarProps = {
  user: {
    name?: string;
    email: string;
    role: string;
    image?: string;
  };
  open: boolean;
  onClose: () => void;
};

function getInitials(name?: string, email?: string) {
  const source = name || email || "A";
  return source
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function AdminSidebar({
  user,
  open,
  onClose,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin-account") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logoutTo(ADMIN_SIGN_IN_PATH);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <>
      {open && (
        <button
          type="button"
          className={k.overlay}
          aria-label="Close menu"
          onClick={onClose}
        />
      )}

      <aside className={`${k.sidebar} ${open ? k.open : ""}`}>
        <Link href="/admin-account" className={k.brand} onClick={onClose}>
          <Image
            src={BRAND_LOGO_URL}
            alt="JK Organics"
            width={168}
            height={46}
            className={k.brandLogo}
            priority
          />
          <span className={k.adminBadge}>Admin</span>
        </Link>

        <nav className={k.nav}>
          {adminNavGroups.map((group) => {
            const items = group.items.filter(
              (item) =>
                !item.superAdminOnly || user.role === "super_admin",
            );

            if (!items.length) return null;

            return (
              <div key={group.title} className={k.group}>
                <p className={k.groupTitle}>{group.title}</p>
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`${k.navLink} ${isActive(item.href) ? k.active : ""}`}
                      onClick={onClose}
                    >
                      <Icon size={18} strokeWidth={2} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className={k.footer}>
          <div className={k.userCard}>
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name || user.email}
                width={36}
                height={36}
                className={k.avatar}
              />
            ) : (
              <div className={k.initials}>
                {getInitials(user.name, user.email)}
              </div>
            )}
            <div className={k.userMeta}>
              <strong>{user.name || "Admin"}</strong>
              <span>{getRoleLabel(user.role)}</span>
            </div>
          </div>
          <button
            type="button"
            className={k.logoutBtn}
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>
    </>
  );
}
