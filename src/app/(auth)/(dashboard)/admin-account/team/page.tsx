"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Fragment, useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  type CreateAdminValues,
  createAdminSchema,
} from "@/lib/admin/admin-user-schema";
import type { AdminUserListItem } from "@/lib/admin/admin-user-service";
import { formatDate } from "@/utils/formatDate";
import ui from "../components/ui/admin-ui.module.scss";
import { AdminCard, PageHeader } from "../components/ui/page-header";
import k from "./team.module.scss";

const ADMIN_ROLE = "min_admin";
const USER_ROLE = "user";

type RoleChoice = typeof ADMIN_ROLE | typeof USER_ROLE;

type TeamDialog =
  | { type: "reset"; user: AdminUserListItem }
  | { type: "status"; user: AdminUserListItem; disabled: boolean }
  | { type: "delete"; user: AdminUserListItem }
  | { type: "role"; user: AdminUserListItem };

const roleChoices: Array<{ value: RoleChoice; label: string }> = [
  { value: ADMIN_ROLE, label: "Admin" },
  { value: USER_ROLE, label: "Customer" },
];

export default function TeamPage() {
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [dialog, setDialog] = useState<TeamDialog | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleChoice>(ADMIN_ROLE);
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");

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

  async function runUserAction({
    user,
    action,
    url,
    method,
    body,
    successMessage,
  }: {
    user: AdminUserListItem;
    action: string;
    url: string;
    method: "PATCH" | "DELETE";
    body?: unknown;
    successMessage: string;
  }): Promise<boolean> {
    setBusyAction(`${action}:${user.id}`);

    try {
      const res = await fetch(url, {
        method,
        ...(body
          ? {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            }
          : {}),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update admin");
      }

      toast.success(successMessage);
      await loadUsers();
      return true;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update admin",
      );
      return false;
    } finally {
      setBusyAction(null);
    }
  }

  async function resetAdminPassword(user: AdminUserListItem) {
    if (!resetPassword || resetPassword !== resetConfirmPassword) {
      toast.error("Enter matching passwords before saving");
      return;
    }

    const complete = await runUserAction({
      user,
      action: "reset",
      url: `/api/admin/users/${user.id}/password`,
      method: "PATCH",
      body: {
        password: resetPassword,
        confirmPassword: resetConfirmPassword,
      },
      successMessage: `${user.name}'s password was reset`,
    });

    if (complete) {
      setDialog(null);
      setResetPassword("");
      setResetConfirmPassword("");
    }
  }

  function openDialog(nextDialog: TeamDialog) {
    if (nextDialog.type === "role") {
      setSelectedRole(
        nextDialog.user.role === USER_ROLE ? USER_ROLE : ADMIN_ROLE,
      );
    }

    if (nextDialog.type !== "reset") {
      setResetPassword("");
      setResetConfirmPassword("");
    }

    setDialog(nextDialog);
  }

  function closeDialog() {
    setDialog(null);
    setResetPassword("");
    setResetConfirmPassword("");
  }

  async function proceedDialog() {
    if (!dialog) {
      return;
    }

    if (dialog.type === "reset") {
      await resetAdminPassword(dialog.user);
      return;
    }

    if (dialog.type === "status") {
      const action = dialog.disabled ? "block" : "unblock";
      const complete = await runUserAction({
        user: dialog.user,
        action,
        url: `/api/admin/users/${dialog.user.id}/status`,
        method: "PATCH",
        body: { disabled: dialog.disabled },
        successMessage: dialog.disabled
          ? `${dialog.user.name} was blocked`
          : `${dialog.user.name} was unblocked`,
      });

      if (complete) {
        setDialog(null);
      }
      return;
    }

    if (dialog.type === "delete") {
      const complete = await runUserAction({
        user: dialog.user,
        action: "delete",
        url: `/api/admin/users/${dialog.user.id}`,
        method: "DELETE",
        successMessage: `${dialog.user.name} was removed from the team`,
      });

      if (complete) {
        setDialog(null);
      }
      return;
    }

    if (selectedRole === dialog.user.role) {
      toast.error("Choose a different role before saving");
      return;
    }

    if (selectedRole !== USER_ROLE) {
      toast.error("Only demoting admins to customers is supported right now");
      return;
    }

    const complete = await runUserAction({
      user: dialog.user,
      action: "role",
      url: `/api/admin/users/${dialog.user.id}`,
      method: "PATCH",
      successMessage: `${dialog.user.name} is now a customer`,
    });

    if (complete) {
      setDialog(null);
    }
  }

  const dialogCopy = getDialogCopy(dialog, selectedRole);

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
                  <th>Status</th>
                  <th>Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <Fragment key={user.id}>
                    <tr>
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
                      <td>
                        <span
                          className={`${ui.badge} ${
                            user.status === "blocked"
                              ? ui.badgeYellow
                              : ui.badgeGreen
                          }`}
                        >
                          {user.statusLabel}
                        </span>
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        <div className={k.actions}>
                          {user.canResetPassword && (
                            <button
                              type="button"
                              className={k.actionBtn}
                              onClick={() =>
                                openDialog({ type: "reset", user })
                              }
                            >
                              Reset
                            </button>
                          )}
                          {user.canRemove && (
                            <button
                              type="button"
                              className={k.actionBtn}
                              onClick={() => openDialog({ type: "role", user })}
                            >
                              Role
                            </button>
                          )}
                          {user.canBlock && (
                            <button
                              type="button"
                              className={k.actionBtn}
                              onClick={() =>
                                openDialog({
                                  type: "status",
                                  user,
                                  disabled: true,
                                })
                              }
                              disabled={busyAction === `block:${user.id}`}
                            >
                              {busyAction === `block:${user.id}`
                                ? "Blocking..."
                                : "Block"}
                            </button>
                          )}
                          {user.canUnblock && (
                            <button
                              type="button"
                              className={k.actionBtn}
                              onClick={() =>
                                openDialog({
                                  type: "status",
                                  user,
                                  disabled: false,
                                })
                              }
                              disabled={busyAction === `unblock:${user.id}`}
                            >
                              {busyAction === `unblock:${user.id}`
                                ? "Unblocking..."
                                : "Unblock"}
                            </button>
                          )}
                          {user.canDelete && (
                            <button
                              type="button"
                              className={k.dangerBtn}
                              onClick={() =>
                                openDialog({ type: "delete", user })
                              }
                              disabled={busyAction === `delete:${user.id}`}
                            >
                              {busyAction === `delete:${user.id}`
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {dialog && (
        <div className={k.modalBackdrop}>
          <section
            aria-labelledby="team-dialog-title"
            aria-modal="true"
            className={k.modal}
            role="dialog"
          >
            <div className={k.modalBody}>
              <div
                aria-hidden="true"
                className={
                  dialogCopy.danger ? k.modalIconDanger : k.modalIconNeutral
                }
              >
                !
              </div>
              <div className={k.modalContent}>
                <h3 id="team-dialog-title">{dialogCopy.title}</h3>
                <p>{dialogCopy.body}</p>

                {dialog.type === "role" && (
                  <fieldset className={k.roleChoices}>
                    <legend>Choose role</legend>
                    {roleChoices.map((role) => (
                      <label
                        className={
                          selectedRole === role.value
                            ? k.roleChoiceActive
                            : k.roleChoice
                        }
                        key={role.value}
                      >
                        <input
                          checked={selectedRole === role.value}
                          name="team-role"
                          onChange={() => setSelectedRole(role.value)}
                          type="radio"
                          value={role.value}
                        />
                        <span>{role.label}</span>
                      </label>
                    ))}
                  </fieldset>
                )}

                {dialog.type === "reset" && (
                  <div className={k.resetPanel}>
                    <label className={k.field}>
                      <span>New password</span>
                      <input
                        autoComplete="new-password"
                        onChange={(event) =>
                          setResetPassword(event.target.value)
                        }
                        type="password"
                        value={resetPassword}
                      />
                    </label>
                    <label className={k.field}>
                      <span>Confirm password</span>
                      <input
                        autoComplete="new-password"
                        onChange={(event) =>
                          setResetConfirmPassword(event.target.value)
                        }
                        type="password"
                        value={resetConfirmPassword}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
            <div className={k.modalActions}>
              <button
                className={k.modalCancel}
                onClick={closeDialog}
                type="button"
              >
                Cancel
              </button>
              <button
                className={dialogCopy.danger ? k.modalDanger : k.modalProceed}
                disabled={busyAction === dialogCopy.busyKey}
                onClick={proceedDialog}
                type="button"
              >
                {busyAction === dialogCopy.busyKey
                  ? dialogCopy.busyLabel
                  : dialogCopy.verb}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function getDialogCopy(dialog: TeamDialog | null, selectedRole: RoleChoice) {
  if (!dialog) {
    return {
      title: "",
      body: "",
      verb: "",
      busyKey: "",
      busyLabel: "",
      danger: false,
    };
  }

  if (dialog.type === "reset") {
    return {
      title: "Reset password?",
      body: `Enter a new temporary password for ${dialog.user.name}. They can use it immediately after you save.`,
      verb: "Save password",
      busyKey: `reset:${dialog.user.id}`,
      busyLabel: "Saving...",
      danger: false,
    };
  }

  if (dialog.type === "status") {
    const blocked = dialog.disabled;
    return {
      title: blocked ? "Block member?" : "Unblock member?",
      body: blocked
        ? `${dialog.user.name} will be signed out and blocked from accessing the admin panel until unblocked.`
        : `${dialog.user.name} will regain access to the admin panel and can sign in again.`,
      verb: blocked ? "Block member" : "Unblock member",
      busyKey: `${blocked ? "block" : "unblock"}:${dialog.user.id}`,
      busyLabel: blocked ? "Blocking..." : "Unblocking...",
      danger: blocked,
    };
  }

  if (dialog.type === "delete") {
    return {
      title: "Delete member?",
      body: `${dialog.user.name} will be removed from the active admin team. This cannot be undone from this screen.`,
      verb: "Delete member",
      busyKey: `delete:${dialog.user.id}`,
      busyLabel: "Deleting...",
      danger: true,
    };
  }

  return {
    title: "Change role?",
    body:
      selectedRole === USER_ROLE
        ? `${dialog.user.name} will lose admin access and become a customer.`
        : `Choose a supported role for ${dialog.user.name}.`,
    verb: "Update role",
    busyKey: `role:${dialog.user.id}`,
    busyLabel: "Updating...",
    danger: selectedRole === USER_ROLE,
  };
}
