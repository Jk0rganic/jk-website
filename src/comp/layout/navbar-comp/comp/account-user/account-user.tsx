"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import k from "./styles.module.scss";
import { User } from "lucide-react";

interface SessionUser {
  role: "user" | "min_admin";
}

export default function AccountUser() {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/session");
        const data = await res.json();
        setUser(data.user ?? null);
      } catch (err) {
        console.error("Session fetch error:", err);
      }
    }

    fetchSession();
  }, []);

  if (!user) {
    return (
      <Link className={k.link} href="/auth/signin">
        <User size={20} />
      </Link>
    );
  }

  return (
    <>
      {user.role === "user" && (
        <Link className={k.link} href="/account">
          My Account
        </Link>
      )}
      {user.role === "min_admin" && (
        <Link className={k.link} href="/admin-account">
          Admin Account
        </Link>
      )}
    </>
  );
}