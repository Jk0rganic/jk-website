"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import AdminSidebar from "./admin-sidebar";
import AdminTopbar from "./admin-topbar";
import k from "./admin-shell.module.scss";

type AdminShellProps = {
  user: {
    name?: string;
    email: string;
    role: string;
    image?: string;
  };
  children: React.ReactNode;
};

export default function AdminShell({ user, children }: AdminShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={k.shell}>
      <AdminSidebar
        user={user}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className={k.main}>
        <AdminTopbar
          pathname={pathname}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <div className={k.content}>{children}</div>
      </div>
    </div>
  );
}
