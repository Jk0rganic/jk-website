"use client";

import { useMemo, useState } from "react";
import k from "./profile-details-page.module.scss";

type ProfileUser = {
  name?: string | null;
  email?: string | null;
  role?: string | null;
  roleLabel?: string | null;
};

type PasswordMessage = {
  ok: boolean;
  text: string;
} | null;

type PasswordStrength = {
  pct: number;
  label: string;
  className: string;
};

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "JK"
  );
}

function getPasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { pct: 0, label: "-", className: k.strengthMuted };
  }

  let score = 0;

  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) {
    return { pct: 33, label: "Weak", className: k.strengthWeak };
  }

  if (score <= 3) {
    return { pct: 66, label: "Good", className: k.strengthGood };
  }

  return { pct: 100, label: "Strong", className: k.strengthStrong };
}

export default function ProfileDetailsPage({ user }: { user: ProfileUser }) {
  const defaultName = user.name || "Admin user";
  const defaultEmail = user.email || "admin@jkorganics.co.ke";
  const roleLabel = user.roleLabel || user.role || "Admin";
  const [fullName, setFullName] = useState(defaultName);
  const [phone, setPhone] = useState("+254 712 345 678");
  const [email, setEmail] = useState(defaultEmail);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<PasswordMessage>(null);
  const strength = useMemo(
    () => getPasswordStrength(newPassword),
    [newPassword],
  );
  const initials = useMemo(() => getInitials(fullName), [fullName]);

  function saveProfile() {
    setProfileMessage("Profile changes saved locally.");
  }

  function updatePassword() {
    if (!currentPassword) {
      setPasswordMessage({ ok: false, text: "Enter your current password." });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({
        ok: false,
        text: "New password must be at least 8 characters.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        ok: false,
        text: "New password and confirmation do not match.",
      });
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMessage({ ok: true, text: "Password updated successfully." });
  }

  return (
    <div className={k.profilePage}>
      <section className={k.card}>
        <div className={k.cardHeader}>
          <h2>Profile</h2>
        </div>
        <div className={k.cardBody}>
          <div className={k.identity}>
            <div className={k.avatar} aria-hidden="true">
              {initials}
            </div>
            <div>
              <div className={k.identityName}>{fullName}</div>
              <div className={k.identityMeta}>
                {roleLabel} &middot; {email}
              </div>
            </div>
          </div>

          <div className={k.formGrid}>
            <label className={k.field}>
              <span>Full name</span>
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Jane Doe"
              />
            </label>

            <label className={k.field}>
              <span>Phone</span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+254 712 345 678"
                type="tel"
              />
            </label>
          </div>

          <label className={k.field}>
            <span>Email</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@jkorganics.co.ke"
              type="email"
            />
          </label>

          {profileMessage && (
            <div className={k.successNote} role="status">
              {profileMessage}
            </div>
          )}

          <button
            className={k.primaryButton}
            type="button"
            onClick={saveProfile}
          >
            Save changes
          </button>
        </div>
      </section>

      <section className={k.card}>
        <div className={k.cardHeader}>
          <h2>Change password</h2>
          <p>
            Use at least 8 characters. You'll stay signed in on this device.
          </p>
        </div>
        <div className={k.cardBody}>
          <label className={k.field}>
            <span>Current password</span>
            <input
              autoComplete="current-password"
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="••••••••"
              type="password"
              value={currentPassword}
            />
          </label>

          <div className={k.formGrid}>
            <label className={k.field}>
              <span>New password</span>
              <input
                autoComplete="new-password"
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="New password"
                type="password"
                value={newPassword}
              />
            </label>

            <label className={k.field}>
              <span>Confirm new password</span>
              <input
                autoComplete="new-password"
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter password"
                type="password"
                value={confirmPassword}
              />
            </label>
          </div>

          {newPassword.length > 0 && (
            <div>
              <div className={k.strengthTrack}>
                <div
                  className={`${k.strengthBar} ${strength.className}`}
                  data-testid="password-strength-bar"
                  style={{ width: `${strength.pct}%` }}
                />
              </div>
              <div className={k.strengthText}>
                Strength:{" "}
                <strong className={strength.className}>{strength.label}</strong>
              </div>
            </div>
          )}

          {passwordMessage && (
            <div
              className={passwordMessage.ok ? k.successNote : k.errorNote}
              role={passwordMessage.ok ? "status" : "alert"}
            >
              {passwordMessage.text}
            </div>
          )}

          <button
            className={k.primaryButton}
            onClick={updatePassword}
            type="button"
          >
            Update password
          </button>
        </div>
      </section>
    </div>
  );
}
