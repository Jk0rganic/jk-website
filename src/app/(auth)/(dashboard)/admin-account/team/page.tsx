"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Ban,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
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
import { AdminBadge } from "../components/ui/admin-badge";
import { AdminEmptyState } from "../components/ui/admin-empty-state";
import { AdminMetricCard } from "../components/ui/admin-metric-card";
import { AdminPanel } from "../components/ui/admin-panel";
import { AdminToolbar } from "../components/ui/admin-toolbar";
import ui from "../components/ui/admin-ui.module.scss";
import { PageHeader } from "../components/ui/page-header";
import k from "./team.module.scss";

type ActionType = "password" | "block" | "unblock" | "delete" | "demote";
type RoleFilter = "all" | "admin" | "super_admin";
type StatusFilter = "all" | "active" | "blocked";
type BadgeTone = "success" | "info" | "warning" | "danger" | "neutral";

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
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showCreateConfirmPassword, setShowCreateConfirmPassword] =
    useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] =
    useState(false);

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

  const teamSummary = useMemo(() => {
    return users.reduce(
      (summary, user) => {
        if (user.role === SUPER_ADMIN_ROLE) summary.superAdmins += 1;
        if (user.isDisabled && !user.isDeleted) summary.blocked += 1;
        if (!user.isDisabled && !user.isDeleted) summary.active += 1;
        return summary;
      },
      { active: 0, blocked: 0, superAdmins: 0 },
    );
  }, [users]);

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
    setShowResetPassword(false);
    setShowResetConfirmPassword(false);
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
      setShowResetPassword(false);
      setShowResetConfirmPassword(false);
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

  function roleTone(user: AdminUserListItem): BadgeTone {
    return user.role === SUPER_ADMIN_ROLE ? "info" : "success";
  }

  function statusTone(user: AdminUserListItem): BadgeTone {
    if (user.isDeleted) return "neutral";
    if (user.isDisabled) return "danger";
    return "success";
  }

  return (
    <>
      <PageHeader
        title="Admins"
        subtitle="Manage admin access, password resets, and account safety."
      />

      <section className={k.metricGrid} aria-label="Admin team KPIs">
        <AdminMetricCard
          label="Total admins"
          value={users.length}
          icon={UsersRound}
          tone="neutral"
          detail={`${filteredUsers.length} shown with filters`}
        />
        <AdminMetricCard
          label="Active access"
          value={teamSummary.active}
          icon={ShieldCheck}
          tone="success"
          detail="Can enter the admin console"
        />
        <AdminMetricCard
          label="Blocked"
          value={teamSummary.blocked}
          icon={Ban}
          tone="danger"
          detail="Access currently disabled"
        />
        <AdminMetricCard
          label="Super admins"
          value={teamSummary.superAdmins}
          icon={LockKeyhole}
          tone="info"
          detail="Can manage other admins"
        />
      </section>

      <div className={k.teamLayout}>
        <AdminPanel
          title="Current admins"
          description="Review access, reset passwords, block accounts, or remove admin privileges."
        >
          <AdminToolbar
            searchLabel="Search admins"
            searchPlaceholder="Search name or email"
            searchValue={search}
            onSearchChange={(event) => setSearch(event.target.value)}
          >
            <label className={k.filterControl}>
              <span>Role</span>
              <select
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(event.target.value as RoleFilter)
                }
              >
                <option value="all">All roles</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super admin</option>
              </select>
            </label>
            <label className={k.filterControl}>
              <span>Status</span>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>
            </label>
          </AdminToolbar>

          {loading && <p className={k.stateText}>Loading team...</p>}
          {error && <p className={k.error}>{error}</p>}

          {!loading && !error && !users.length && (
            <AdminEmptyState
              title="No admin accounts yet"
              description="Create the first admin account from the side panel."
            />
          )}

          {!loading && !error && users.length > 0 && !filteredUsers.length && (
            <AdminEmptyState
              title="No admins match these filters"
              description="Adjust search, role, or status filters to widen the list."
            />
          )}

          {!loading && !error && filteredUsers.length > 0 && (
            <div className={`${ui.tableWrap} ${k.teamTableWrap}`}>
              <table className={`${ui.table} ${k.teamTable}`}>
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
                      <td data-label="Name">
                        <strong className={k.adminName}>{user.name}</strong>
                      </td>
                      <td data-label="Email">
                        <span className={k.adminEmail}>{user.email}</span>
                      </td>
                      <td data-label="Role">
                        <AdminBadge tone={roleTone(user)}>
                          {user.roleLabel}
                        </AdminBadge>
                      </td>
                      <td data-label="Status">
                        <AdminBadge tone={statusTone(user)}>
                          {user.statusLabel === "Disabled"
                            ? "Blocked"
                            : user.statusLabel}
                        </AdminBadge>
                      </td>
                      <td data-label="Added">{formatDate(user.createdAt)}</td>
                      <td data-label="Actions">
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
                          <span className={ui.muted}>Protected</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminPanel>

        <aside className={k.sideRail} aria-label="Admin account tools">
          <AdminPanel
            title="Create admin"
            description="Add a trusted staff account with a secure temporary password."
            action={<UserPlus size={18} aria-hidden />}
          >
            <form className={k.formSection} onSubmit={handleSubmit(onSubmit)}>
              <label className={k.field}>
                <span>Full name</span>
                <input {...register("name")} autoComplete="name" />
                {errors.name && <em>{errors.name.message}</em>}
              </label>

              <label className={k.field}>
                <span>Email</span>
                <input
                  {...register("email")}
                  type="email"
                  autoComplete="email"
                />
                {errors.email && <em>{errors.email.message}</em>}
              </label>

              <label className={k.field}>
                <span>Temporary password</span>
                <div className={k.passwordField}>
                  <input
                    {...register("password")}
                    type={showCreatePassword ? "text" : "password"}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword((value) => !value)}
                    aria-label={
                      showCreatePassword ? "Hide password" : "Show password"
                    }
                  >
                    {showCreatePassword ? (
                      <EyeOff size={16} aria-hidden />
                    ) : (
                      <Eye size={16} aria-hidden />
                    )}
                  </button>
                </div>
                {errors.password && <em>{errors.password.message}</em>}
              </label>

              <label className={k.field}>
                <span>Confirm password</span>
                <div className={k.passwordField}>
                  <input
                    {...register("confirmPassword")}
                    type={showCreateConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowCreateConfirmPassword((value) => !value)
                    }
                    aria-label={
                      showCreateConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    {showCreateConfirmPassword ? (
                      <EyeOff size={16} aria-hidden />
                    ) : (
                      <Eye size={16} aria-hidden />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <em>{errors.confirmPassword.message}</em>
                )}
              </label>

              <button type="submit" className={ui.btnAccent} disabled={saving}>
                {saving ? "Creating..." : "Create admin"}
              </button>
            </form>
          </AdminPanel>

          <AdminPanel title="Access rules" description="Security defaults for this console.">
            <ul className={k.ruleList}>
              <li>Only super admins can manage admin accounts.</li>
              <li>Password resets invalidate the admin's active sessions.</li>
              <li>Blocked admins cannot access the admin console.</li>
            </ul>
          </AdminPanel>
        </aside>
      </div>

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
                <X size={16} aria-hidden />
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
                  <div className={k.passwordField}>
                    <input
                      {...registerPassword("password")}
                      type={showResetPassword ? "text" : "password"}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword((value) => !value)}
                      aria-label={
                        showResetPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showResetPassword ? (
                        <EyeOff size={16} aria-hidden />
                      ) : (
                        <Eye size={16} aria-hidden />
                      )}
                    </button>
                  </div>
                  {passwordErrors.password && (
                    <em>{passwordErrors.password.message}</em>
                  )}
                </label>

                <label className={k.field}>
                  <span>Confirm password</span>
                  <div className={k.passwordField}>
                    <input
                      {...registerPassword("confirmPassword")}
                      type={showResetConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowResetConfirmPassword((value) => !value)
                      }
                      aria-label={
                        showResetConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                    >
                      {showResetConfirmPassword ? (
                        <EyeOff size={16} aria-hidden />
                      ) : (
                        <Eye size={16} aria-hidden />
                      )}
                    </button>
                  </div>
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
