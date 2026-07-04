"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  type CreateAdminValues,
  createAdminSchema,
  type ResetAdminPasswordValues,
  resetAdminPasswordSchema,
} from "@/lib/admin/admin-user-schema";
import type { AdminUserListItem } from "@/lib/admin/admin-user-service";
import { ADMIN_ROLE, SUPER_ADMIN_ROLE } from "@/lib/admin/roles";
import { formatDate } from "@/utils/formatDate";
import ui from "../components/ui/admin-ui.module.scss";
import { AdminCard, PageHeader } from "../components/ui/page-header";
import k from "./team.module.scss";

type ActionType = "password" | "block" | "unblock" | "delete" | "demote";
type RoleFilter = "all" | "admin" | "super_admin";
type StatusFilter = "all" | "active" | "blocked";

const actionCopy: Record<
  ActionType,
  {
    title: string;
    submitLabel: string;
    loadingLabel: string;
    warning: string;
    success: (user: AdminUserListItem) => string;
  }
> = {
  password: {
    title: "Reset password",
    submitLabel: "Reset password",
    loadingLabel: "Resetting...",
    warning:
      "Set a new password for this admin. Their existing sessions will be invalidated.",
    success: (user) => `${user.name}'s password was reset`,
  },
  block: {
    title: "Block admin",
    submitLabel: "Block admin",
    loadingLabel: "Blocking...",
    warning:
      "This admin will immediately lose access to the admin panel and active sessions will end.",
    success: (user) => `${user.name} was blocked`,
  },
  unblock: {
    title: "Unblock admin",
    submitLabel: "Unblock admin",
    loadingLabel: "Unblocking...",
    warning: "This admin will regain access to the admin panel.",
    success: (user) => `${user.name} was unblocked`,
  },
  delete: {
    title: "Delete admin",
    submitLabel: "Delete admin",
    loadingLabel: "Deleting...",
    warning:
      "This soft deletes the admin account and ends active sessions. The account will no longer appear as active.",
    success: (user) => `${user.name} was deleted`,
  },
  demote: {
    title: "Remove admin role",
    submitLabel: "Remove role",
    loadingLabel: "Removing...",
    warning:
      "This removes admin access and changes the account back to a regular customer.",
    success: (user) => `${user.name} is now a customer`,
  },
};

export default function TeamPage() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionUser, setActionUser] = useState<AdminUserListItem | null>(null);
  const [actionType, setActionType] = useState<ActionType | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

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

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm<ResetAdminPasswordValues>({
    resolver: zodResolver(resetAdminPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !normalizedSearch ||
        user.name.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch);
      const matchesRole =
        roleFilter === "all" ||
        (roleFilter === "admin" && user.role === ADMIN_ROLE) ||
        (roleFilter === "super_admin" && user.role === SUPER_ADMIN_ROLE);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && !user.isDisabled && !user.isDeleted) ||
        (statusFilter === "blocked" && user.isDisabled && !user.isDeleted);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [roleFilter, search, statusFilter, users]);

  const loadUsers = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

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

  function openAction(user: AdminUserListItem, type: ActionType) {
    setActionUser(user);
    setActionType(type);
  }

  function closeAction() {
    if (actionLoading) return;
    setActionUser(null);
    setActionType(null);
    resetPasswordForm();
  }

  async function readApiError(res: Response, fallback: string) {
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.error || fallback);
    }

    return data;
  }

  async function submitAction(values?: ResetAdminPasswordValues) {
    if (!actionUser || !actionType) return;

    setActionLoading(true);

    try {
      if (actionType === "password") {
        const res = await fetch(`/api/admin/users/${actionUser.id}/password`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        await readApiError(res, "Failed to reset admin password");
      } else if (actionType === "block" || actionType === "unblock") {
        const res = await fetch(`/api/admin/users/${actionUser.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ disabled: actionType === "block" }),
        });
        await readApiError(res, "Failed to update admin status");
      } else {
        const res = await fetch(`/api/admin/users/${actionUser.id}`, {
          method: actionType === "delete" ? "DELETE" : "PATCH",
        });
        await readApiError(
          res,
          actionType === "delete"
            ? "Failed to delete admin"
            : "Failed to remove admin",
        );
      }

      toast.success(actionCopy[actionType].success(actionUser));
      setActionUser(null);
      setActionType(null);
      resetPasswordForm();
      await loadUsers();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update admin",
      );
    } finally {
      setActionLoading(false);
    }
  }

  const currentAction = actionType ? actionCopy[actionType] : null;
  const showActionDialog = Boolean(actionUser && actionType && currentAction);
  const actionButtonsDisabled = actionLoading;

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
        <div className={ui.toolbar}>
          <input
            className={ui.searchInput}
            type="search"
            placeholder="Search name or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            className={ui.select}
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(event.target.value as RoleFilter)
            }
            aria-label="Filter by role"
          >
            <option value="all">All roles</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super admin</option>
          </select>
          <select
            className={ui.select}
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>

        {loading && <p className={ui.muted}>Loading team…</p>}
        {error && <p className={ui.error}>{error}</p>}

        {!loading && !error && !users.length && (
          <p className={ui.empty}>No admin accounts yet.</p>
        )}

        {!loading && !error && users.length > 0 && !filteredUsers.length && (
          <p className={ui.empty}>No admins match these filters.</p>
        )}

        {!loading && !error && filteredUsers.length > 0 && (
          <div className={ui.tableWrap}>
            <table className={ui.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span
                        className={`${ui.badge} ${
                          user.role === SUPER_ADMIN_ROLE
                            ? ui.badgeViolet
                            : ui.badgeGreen
                        }`}
                      >
                        {user.roleLabel}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`${ui.badge} ${
                          user.isDeleted
                            ? ui.badgeGray
                            : user.isDisabled
                              ? ui.badgeRed
                              : ui.badgeGreen
                        }`}
                      >
                        {user.statusLabel === "Disabled"
                          ? "Blocked"
                          : user.statusLabel}
                      </span>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      {user.canResetPassword ||
                      user.canBlock ||
                      user.canUnblock ||
                      user.canDelete ||
                      user.canDemote ? (
                        <div className={k.actions}>
                          {user.canResetPassword && (
                            <button
                              type="button"
                              className={k.actionBtn}
                              onClick={() => openAction(user, "password")}
                              disabled={actionButtonsDisabled}
                            >
                              Password
                            </button>
                          )}
                          {user.canBlock && (
                            <button
                              type="button"
                              className={k.actionBtn}
                              onClick={() => openAction(user, "block")}
                              disabled={actionButtonsDisabled}
                            >
                              Block
                            </button>
                          )}
                          {user.canUnblock && (
                            <button
                              type="button"
                              className={k.actionBtn}
                              onClick={() => openAction(user, "unblock")}
                              disabled={actionButtonsDisabled}
                            >
                              Unblock
                            </button>
                          )}
                          {user.canDemote && (
                            <button
                              type="button"
                              className={k.actionBtn}
                              onClick={() => openAction(user, "demote")}
                              disabled={actionButtonsDisabled}
                            >
                              Remove role
                            </button>
                          )}
                          {user.canDelete && (
                            <button
                              type="button"
                              className={k.dangerBtn}
                              onClick={() => openAction(user, "delete")}
                              disabled={actionButtonsDisabled}
                            >
                              Delete
                            </button>
                          )}
                        </div>
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

      {showActionDialog && actionUser && currentAction && (
        <div className={k.modalLayer} role="presentation">
          <section
            className={k.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-action-title"
          >
            <div className={k.dialogHeader}>
              <h2 id="team-action-title">{currentAction.title}</h2>
              <button
                type="button"
                className={k.closeBtn}
                onClick={closeAction}
                disabled={actionLoading}
                aria-label="Close dialog"
              >
                x
              </button>
            </div>

            <div className={k.target}>
              <strong>{actionUser.name}</strong>
              <span>{actionUser.email}</span>
            </div>

            <p className={k.warning}>{currentAction.warning}</p>

            {actionType === "password" ? (
              <form
                className={k.dialogForm}
                onSubmit={handlePasswordSubmit((values) =>
                  submitAction(values),
                )}
              >
                <label className={k.field}>
                  <span>New password</span>
                  <input
                    {...registerPassword("password")}
                    type="password"
                    autoComplete="new-password"
                  />
                  {passwordErrors.password && (
                    <em>{passwordErrors.password.message}</em>
                  )}
                </label>

                <label className={k.field}>
                  <span>Confirm password</span>
                  <input
                    {...registerPassword("confirmPassword")}
                    type="password"
                    autoComplete="new-password"
                  />
                  {passwordErrors.confirmPassword && (
                    <em>{passwordErrors.confirmPassword.message}</em>
                  )}
                </label>

                <div className={k.dialogActions}>
                  <button
                    type="button"
                    className={k.cancelBtn}
                    onClick={closeAction}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={ui.btnAccent}
                    disabled={actionLoading}
                  >
                    {actionLoading
                      ? currentAction.loadingLabel
                      : currentAction.submitLabel}
                  </button>
                </div>
              </form>
            ) : (
              <div className={k.dialogActions}>
                <button
                  type="button"
                  className={k.cancelBtn}
                  onClick={closeAction}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={
                    actionType === "delete" || actionType === "demote"
                      ? k.dangerBtn
                      : ui.btnAccent
                  }
                  onClick={() => submitAction()}
                  disabled={actionLoading}
                >
                  {actionLoading
                    ? currentAction.loadingLabel
                    : currentAction.submitLabel}
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
