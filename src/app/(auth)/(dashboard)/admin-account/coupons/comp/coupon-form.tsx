"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  couponFormSchema,
  type CouponFormValues,
} from "@/lib/admin/coupon-schema";
import type { AdminCoupon } from "@/lib/admin/coupon-service";
import { couponToFormValues } from "@/lib/admin/coupon-service";
import k from "./coupon-form.module.scss";

type CouponFormProps = {
  mode: "create" | "edit";
  coupon?: AdminCoupon;
  onSuccess: () => void;
};

const defaultValues: CouponFormValues = {
  code: "",
  discountType: "percent",
  amount: "",
  description: "",
  published: true,
  usageLimit: "",
  minimumAmount: "",
  maximumAmount: "",
  usageLimitPerUser: "",
  individualUse: false,
  expiresAt: "",
};

export default function CouponForm({ mode, coupon, onSuccess }: CouponFormProps) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CouponFormValues>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: coupon ? couponToFormValues(coupon) : defaultValues,
  });

  const discountType = watch("discountType");
  const codeValue = watch("code");

  async function onSubmit(values: CouponFormValues) {
    setSaving(true);

    try {
      const endpoint =
        mode === "create"
          ? "/api/admin/coupons"
          : `/api/admin/coupons/${coupon?.id}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save coupon");
      }

      toast.success(
        mode === "create" ? "Coupon created" : "Coupon updated successfully",
      );
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save coupon");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!coupon || !window.confirm(`Delete coupon ${coupon.code}?`)) return;

    setDeleting(true);

    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete coupon");
      }

      toast.success("Coupon deleted");
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete coupon");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form className={k.form} onSubmit={handleSubmit(onSubmit)}>
      <section className={k.section}>
        <h2>Coupon details</h2>
        <p className={k.help}>
          Customers enter this code at checkout. Codes are saved in uppercase.
        </p>

        <label className={k.field}>
          <span>Coupon code</span>
          <input
            {...register("code")}
            placeholder="e.g. WELCOME10"
            style={{ textTransform: "uppercase" }}
          />
          {errors.code && <em>{errors.code.message}</em>}
          {codeValue && (
            <span className={k.codePreview}>{codeValue.toUpperCase()}</span>
          )}
        </label>

        <label className={k.field}>
          <span>Description (optional)</span>
          <textarea
            {...register("description")}
            rows={2}
            placeholder="Internal note, e.g. Launch week promo"
          />
        </label>
      </section>

      <section className={k.section}>
        <h2>Discount</h2>

        <div className={k.row}>
          <label className={k.field}>
            <span>Discount type</span>
            <select {...register("discountType")}>
              <option value="percent">Percentage off cart</option>
              <option value="fixed_cart">Fixed amount off cart</option>
            </select>
          </label>

          <label className={k.field}>
            <span>
              {discountType === "percent" ? "Percentage" : "Amount (KSh)"}
            </span>
            <input
              {...register("amount")}
              inputMode="decimal"
              placeholder={discountType === "percent" ? "10" : "500"}
            />
            {errors.amount && <em>{errors.amount.message}</em>}
          </label>
        </div>
      </section>

      <section className={k.section}>
        <h2>Limits</h2>
        <p className={k.help}>Optional rules for when this coupon can be used.</p>

        <div className={k.row}>
          <label className={k.field}>
            <span>Minimum order (KSh)</span>
            <input
              {...register("minimumAmount")}
              inputMode="decimal"
              placeholder="0"
            />
            {errors.minimumAmount && <em>{errors.minimumAmount.message}</em>}
          </label>

          <label className={k.field}>
            <span>Usage limit</span>
            <input
              {...register("usageLimit")}
              inputMode="numeric"
              placeholder="Unlimited"
            />
            {errors.usageLimit && <em>{errors.usageLimit.message}</em>}
          </label>

          <label className={k.field}>
            <span>Maximum order (KSh)</span>
            <input
              {...register("maximumAmount")}
              inputMode="decimal"
              placeholder="No maximum"
            />
            {errors.maximumAmount && <em>{errors.maximumAmount.message}</em>}
          </label>

          <label className={k.field}>
            <span>Usage limit per customer</span>
            <input
              {...register("usageLimitPerUser")}
              inputMode="numeric"
              placeholder="Unlimited"
            />
            {errors.usageLimitPerUser && (
              <em>{errors.usageLimitPerUser.message}</em>
            )}
          </label>

          <label className={k.field}>
            <span>Expiry date</span>
            <input type="date" {...register("expiresAt")} />
          </label>
        </div>

        <label className={k.checkbox}>
          <input type="checkbox" {...register("individualUse")} />
          Individual use only
        </label>
      </section>

      <section className={k.section}>
        <h2>Status</h2>
        <label className={k.checkbox}>
          <input type="checkbox" {...register("published")} />
          Active — customers can use this coupon at checkout
        </label>
      </section>

      <div className={k.actions}>
        <button type="submit" disabled={saving || deleting}>
          {saving
            ? "Saving…"
            : mode === "create"
              ? "Create coupon"
              : "Save changes"}
        </button>

        {mode === "edit" && (
          <button
            type="button"
            className={k.dangerButton}
            onClick={handleDelete}
            disabled={saving || deleting}
          >
            {deleting ? "Deleting…" : "Delete coupon"}
          </button>
        )}
      </div>
    </form>
  );
}
