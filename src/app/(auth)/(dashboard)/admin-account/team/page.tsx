"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  createAdminSchema,
  type CreateAdminValues,
} from "@/lib/admin/admin-user-schema";
import type { AdminUserListItem } from "@/lib/admin/admin-user-service";
import { formatDate } from "@/utils/formatDate";
import { PageHeader, AdminCard } from "../components/ui/page-header";
import ui from "../components/ui/admin-ui.module.scss";
import k from "./team.module.scss";

export default function TeamPage() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAdminValues>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function loadUsers() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load team");
      }

      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load team");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function onSubmit(values: CreateAdminValues) {
    setSaving(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create admin");
      }

      toast.success(
        data.promoted
          ? "Existing customer promoted to admin"
          : "Admin account created",
      );
      reset();
      await loadUsers();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create admin",
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeAdmin(user: AdminUserListItem) {
    if (
      !window.confirm(
        `Remove admin access for ${user.name}? They will become a regular customer.`,
      )
    ) {
      return;
    }

    setRemovingId(user.id);

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to remove admin");
      }

      toast.success(`${user.name} is now a customer`);
      await loadUsers();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove admin",
      );
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Team"
        subtitle="Invite store managers and control who can access the admin panel."
      />

      <AdminCard title="Create admin">
        <form className={k.formSection} onSubmit={handleSubmit(onSubmit)}>
          <label className={k.field}>
            <span>Full name</span>
            <input {...register("name")} placeholder="Jane Kamau" />
            {errors.name && <em>{errors.name.message}</em>}
          </label>

          <label className={k.field}>
            <span>Email</span>
            <input
              {...register("email")}
              type="email"
              placeholder="jane@jkorganics.com"
            />
            {errors.email && <em>{errors.email.message}</em>}
          </label>

          <div className={k.row}>
            <label className={k.field}>
              <span>Temporary password</span>
              <input
                {...register("password")}
                type="password"
                autoComplete="new-password"
              />
              {errors.password && <em>{errors.password.message}</em>}
            </label>

            <label className={k.field}>
              <span>Confirm password</span>
              <input
                {...register("confirmPassword")}
                type="password"
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <em>{errors.confirmPassword.message}</em>
              )}
            </label>
          </div>

          <button type="submit" className={ui.btnAccent} disabled={saving}>
            {saving ? "Creating…" : "Create admin"}
          </button>
        </form>
      </AdminCard>

      <AdminCard title="Current admins">
        {loading && <p className={ui.muted}>Loading team…</p>}
        {error && <p className={ui.error}>{error}</p>}

        {!loading && !error && !users.length && (
          <p className={ui.empty}>No admin accounts yet.</p>
        )}

        {!loading && !error && users.length > 0 && (
          <div className={ui.tableWrap}>
            <table className={ui.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Added</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span
                        className={`${ui.badge} ${
                          user.role === "super_admin"
                            ? ui.badgeViolet
                            : ui.badgeGreen
                        }`}
                      >
                        {user.roleLabel}
                      </span>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      {user.canRemove ? (
                        <button
                          type="button"
                          className={k.removeBtn}
                          onClick={() => removeAdmin(user)}
                          disabled={removingId === user.id}
                        >
                          {removingId === user.id ? "Removing…" : "Remove"}
                        </button>
                      ) : (
                        <span className={ui.muted}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </>
  );
}
