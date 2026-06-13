"use client";

import { useAccount } from "../../../dashboard-utils/account-context";
import styles from "./styles.module.scss";
import { maskEmail } from "@/utils/mask";

export default function DetailsPage() {
  const { session } = useAccount();

  const firstName = session?.user?.name || "";
  const email = session?.user?.email || "";
  const usedEmail = maskEmail(email);

  return (
    <div className={styles.details_page}>
      <h1>Account Details</h1>
      <p>This is your account information.</p>

      <div className={styles.read_only_form}>
        <div className={styles.form_group}>
          <label htmlFor="name">Name</label>
          <input id="name" type="text" value={firstName} readOnly />
        </div>

        <div className={styles.form_group}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={usedEmail} readOnly />
        </div>

        <div className={styles.form_group}>
          <label htmlFor="password">Password</label>
          <input type="password" value="••••••••••••••••••••••••" readOnly />
          <small>Contact support if you need to change your password.</small>
        </div>
      </div>
    </div>
  );
}
