import { formatCouponDiscountLabel } from "@/lib/checkout/coupon";
import type { CouponFormValues } from "./coupon-schema";

export type WooCoupon = {
  id: number;
  code: string;
  amount: string;
  discount_type: string;
  description: string;
  date_expires: string | null;
  usage_count: number;
  usage_limit: number | null;
  usage_limit_per_user?: number | null;
  status: string;
  individual_use: boolean;
  minimum_amount: string;
  maximum_amount?: string;
};

export type AdminCoupon = {
  id: number;
  code: string;
  amount: string;
  discountType: string;
  discountLabel: string;
  description: string;
  expiresAt: string | null;
  usageCount: number;
  usageLimit: number | null;
  active: boolean;
  minimumAmount: string;
  maximumAmount: string;
  usageLimitPerUser: string;
  individualUse: boolean;
};

export function mapWooCoupon(coupon: WooCoupon): AdminCoupon {
  return {
    id: coupon.id,
    code: coupon.code,
    amount: coupon.amount,
    discountType: coupon.discount_type,
    discountLabel: formatCouponDiscountLabel(coupon),
    description: coupon.description || "",
    expiresAt: coupon.date_expires,
    usageCount: coupon.usage_count ?? 0,
    usageLimit: coupon.usage_limit,
    active: coupon.status === "publish",
    minimumAmount: coupon.minimum_amount || "",
    maximumAmount: coupon.maximum_amount || "",
    usageLimitPerUser:
      coupon.usage_limit_per_user !== null &&
      coupon.usage_limit_per_user !== undefined
        ? String(coupon.usage_limit_per_user)
        : "",
    individualUse: coupon.individual_use ?? false,
  };
}

export function couponToFormValues(coupon: AdminCoupon): CouponFormValues {
  return {
    code: coupon.code,
    discountType:
      coupon.discountType === "fixed_cart" ? "fixed_cart" : "percent",
    amount: coupon.amount,
    description: coupon.description,
    published: coupon.active,
    usageLimit: coupon.usageLimit !== null ? String(coupon.usageLimit) : "",
    minimumAmount: coupon.minimumAmount || "",
    maximumAmount: coupon.maximumAmount || "",
    usageLimitPerUser: coupon.usageLimitPerUser || "",
    individualUse: coupon.individualUse,
    expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : "",
  };
}

export function formValuesToWooCouponPayload(values: CouponFormValues) {
  const usageLimit =
    values.usageLimit && values.usageLimit.trim()
      ? Number(values.usageLimit)
      : null;
  const usageLimitPerUser =
    values.usageLimitPerUser && values.usageLimitPerUser.trim()
      ? Number(values.usageLimitPerUser)
      : null;

  return {
    code: values.code,
    discount_type: values.discountType,
    amount: values.amount,
    description: values.description || "",
    status: values.published ? "publish" : "draft",
    individual_use: values.individualUse ?? false,
    usage_limit: usageLimit,
    usage_limit_per_user: usageLimitPerUser,
    minimum_amount: values.minimumAmount || "",
    maximum_amount: values.maximumAmount || "",
    date_expires: values.expiresAt
      ? `${values.expiresAt}T23:59:59`
      : null,
  };
}

export type CouponSummary = {
  total: number;
  active: number;
  expired: number;
  exhausted: number;
};

export function summarizeCoupons(coupons: AdminCoupon[]): CouponSummary {
  const now = Date.now();

  return coupons.reduce(
    (acc, coupon) => {
      acc.total += 1;

      if (coupon.active) {
        acc.active += 1;
      }

      if (coupon.expiresAt) {
        const expiresAt = new Date(coupon.expiresAt).getTime();
        if (!Number.isNaN(expiresAt) && expiresAt < now) {
          acc.expired += 1;
        }
      }

      if (
        coupon.usageLimit !== null &&
        coupon.usageCount >= coupon.usageLimit
      ) {
        acc.exhausted += 1;
      }

      return acc;
    },
    { total: 0, active: 0, expired: 0, exhausted: 0 },
  );
}
