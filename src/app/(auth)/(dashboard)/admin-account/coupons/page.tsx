"use client";

import {
  BadgePercent,
  CheckCircle2,
  Clock3,
  Plus,
  TicketPercent,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { type AdminCoupon, summarizeCoupons } from "@/lib/admin/coupon-service";
import { formatPrice } from "@/utils/format-price";
import { formatDate } from "@/utils/formatDate";
import { AdminBadge } from "../components/ui/admin-badge";
import { AdminEmptyState } from "../components/ui/admin-empty-state";
import { AdminMetricCard } from "../components/ui/admin-metric-card";
import { AdminPanel } from "../components/ui/admin-panel";
import { AdminToolbar } from "../components/ui/admin-toolbar";
import ui from "../components/ui/admin-ui.module.scss";
import { PageHeader } from "../components/ui/page-header";

const EXPIRING_SOON_DAYS = 7;
type BadgeTone = "success" | "info" | "warning" | "danger" | "neutral";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadCoupons() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/admin/coupons");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load coupons");
        }

        setCoupons(data.coupons);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load coupons");
      } finally {
        setLoading(false);
      }
    }

    loadCoupons();
  }, []);

  const summary = useMemo(() => summarizeCoupons(coupons), [coupons]);

  const filteredCoupons = useMemo(() => {
    if (!search.trim()) return coupons;

    const query = search.trim().toLowerCase();
    return coupons.filter((coupon) =>
      [coupon.code, coupon.description, coupon.discountLabel]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [coupons, search]);

  function getCouponStatus(coupon: AdminCoupon): {
    label: string;
    tone: BadgeTone;
  } {
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      return { label: "Exhausted", tone: "danger" as const };
    }

    if (coupon.expiresAt) {
      const expiresAt = new Date(coupon.expiresAt);
      if (!Number.isNaN(expiresAt.getTime()) && expiresAt < new Date()) {
        return { label: "Expired", tone: "warning" as const };
      }

      const expiringSoonMs = EXPIRING_SOON_DAYS * 24 * 60 * 60 * 1000;
      if (
        !Number.isNaN(expiresAt.getTime()) &&
        expiresAt.getTime() - Date.now() <= expiringSoonMs
      ) {
        return { label: "Expiring soon", tone: "warning" as const };
      }
    }

    if (coupon.active) {
      return { label: "Active", tone: "success" as const };
    }

    return { label: "Draft", tone: "neutral" as const };
  }

  function formatCouponAmount(coupon: AdminCoupon) {
    return coupon.discountType === "percent"
      ? `${coupon.amount}%`
      : formatPrice(coupon.amount);
  }

  function formatDiscountType(coupon: AdminCoupon) {
    return coupon.discountType === "fixed_cart" ? "Fixed cart" : "Percentage";
  }

  return (
    <>
      <PageHeader
        title="Coupons"
        subtitle={`${filteredCoupons.length} visible of ${coupons.length} loaded coupons. Track activity, expiry, and usage limits.`}
        action={
          <Link href="/admin-account/coupons/new" className={ui.btnPrimary}>
            <Plus size={16} aria-hidden />
            New coupon
          </Link>
        }
      />

      <section className={ui.statGrid} aria-label="Coupon KPIs">
        <AdminMetricCard
          label="Total coupons"
          value={summary.total}
          icon={TicketPercent}
          tone="neutral"
          detail="Loaded discount codes"
        />
        <AdminMetricCard
          label="Active"
          value={summary.active}
          icon={CheckCircle2}
          tone="success"
          detail="Published at checkout"
        />
        <AdminMetricCard
          label="Expired"
          value={summary.expired}
          icon={Clock3}
          tone="warning"
          detail="Past expiry date"
        />
        <AdminMetricCard
          label="Exhausted"
          value={summary.exhausted}
          icon={BadgePercent}
          tone="danger"
          detail="Usage limit reached"
        />
      </section>

      <AdminPanel
        title="Coupon table"
        description="Code, discount, usage, expiry, and status for checkout operations."
      >
        <AdminToolbar
          searchLabel="Search coupons"
          searchPlaceholder="Search code, description, or discount"
          searchValue={search}
          onSearchChange={(e) => setSearch(e.target.value)}
        />

        {loading && <p className={ui.muted}>Loading coupons…</p>}
        {error && <p className={ui.error}>{error}</p>}

        {!loading && !error && !filteredCoupons.length && (
          <AdminEmptyState
            title="No coupons match this search"
            description="Clear or adjust the search to see more checkout discounts."
            icon={TicketPercent}
          />
        )}

        {!loading && !error && filteredCoupons.length > 0 && (
          <div className={ui.tableWrap}>
            <table className={ui.table}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Type / discount</th>
                  <th>Amount</th>
                  <th>Usage</th>
                  <th>Expiry</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoupons.map((coupon) => {
                  const status = getCouponStatus(coupon);

                  return (
                    <tr key={coupon.id}>
                      <td data-label="Code">
                        <strong>{coupon.code}</strong>
                        {coupon.description && (
                          <div className={ui.muted}>{coupon.description}</div>
                        )}
                      </td>
                      <td data-label="Type / discount">
                        <strong>{formatDiscountType(coupon)}</strong>
                        <div className={ui.muted}>{coupon.discountLabel}</div>
                      </td>
                      <td data-label="Amount">{formatCouponAmount(coupon)}</td>
                      <td data-label="Usage">
                        {coupon.usageCount}
                        {coupon.usageLimit !== null
                          ? ` / ${coupon.usageLimit}`
                          : ""}
                      </td>
                      <td data-label="Expiry">
                        {coupon.expiresAt ? formatDate(coupon.expiresAt) : "—"}
                      </td>
                      <td data-label="Status">
                        <AdminBadge tone={status.tone}>
                          {status.label}
                        </AdminBadge>
                      </td>
                      <td data-label="Actions">
                        <Link href={`/admin-account/coupons/${coupon.id}`}>
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>
    </>
  );
}
