"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatDate } from "@/utils/formatDate";
import {
  summarizeCoupons,
  type AdminCoupon,
} from "@/lib/admin/coupon-service";
import { PageHeader } from "../components/ui/page-header";
import ui from "../../components/ui/admin-ui.module.scss";

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

  const toneClass = {
    active: ui.badgeGreen,
    draft: ui.badgeGray,
    expired: ui.badgeYellow,
    exhausted: ui.badgeRed,
  } as const;

  function getCouponStatus(coupon: AdminCoupon) {
    if (
      coupon.usageLimit !== null &&
      coupon.usageCount >= coupon.usageLimit
    ) {
      return { label: "Exhausted", tone: toneClass.exhausted };
    }

    if (coupon.expiresAt) {
      const expiresAt = new Date(coupon.expiresAt);
      if (!Number.isNaN(expiresAt.getTime()) && expiresAt < new Date()) {
        return { label: "Expired", tone: toneClass.expired };
      }
    }

    if (coupon.active) {
      return { label: "Active", tone: toneClass.active };
    }

    return { label: "Draft", tone: toneClass.draft };
  }

  return (
    <>
      <PageHeader
        title="Coupons"
        subtitle="Create discount codes customers can apply at checkout."
        action={
          <Link href="/admin-account/coupons/new" className={ui.btnPrimary}>
            New coupon
          </Link>
        }
      />

      <div className={ui.statGrid}>
        {[
          { label: "Total", value: summary.total },
          { label: "Active", value: summary.active },
          { label: "Expired", value: summary.expired },
          { label: "Exhausted", value: summary.exhausted },
        ].map((item) => (
          <article key={item.label} className={ui.statCard}>
            <span className={ui.statLabel}>{item.label}</span>
            <div className={ui.statValue}>{item.value}</div>
          </article>
        ))}
      </div>

      <section className={ui.card}>
        <div className={ui.cardBody}>
          <div className={ui.toolbar}>
            <input
              type="search"
              placeholder="Search by code or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={ui.searchInput}
            />
          </div>

          {loading && <p className={ui.muted}>Loading coupons…</p>}
          {error && <p className={ui.error}>{error}</p>}

          {!loading && !error && !filteredCoupons.length && (
            <p className={ui.empty}>No coupons found.</p>
          )}

          {!loading && !error && filteredCoupons.length > 0 && (
            <div className={ui.tableWrap}>
              <table className={ui.table}>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Discount</th>
                    <th>Usage</th>
                    <th>Expires</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filteredCoupons.map((coupon) => {
                    const status = getCouponStatus(coupon);

                    return (
                      <tr key={coupon.id}>
                        <td>
                          <strong>{coupon.code}</strong>
                          {coupon.description && (
                            <div className={ui.muted}>{coupon.description}</div>
                          )}
                        </td>
                        <td>{coupon.discountLabel}</td>
                        <td>
                          {coupon.usageCount}
                          {coupon.usageLimit !== null
                            ? ` / ${coupon.usageLimit}`
                            : ""}
                        </td>
                        <td>
                          {coupon.expiresAt
                            ? formatDate(coupon.expiresAt)
                            : "—"}
                        </td>
                        <td>
                          <span className={status.tone}>{status.label}</span>
                        </td>
                        <td>
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
        </div>
      </section>
    </>
  );
}
