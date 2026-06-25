export type CheckoutCoupon = {
  code: string;
  amount: string;
  discount_type: "percent" | "fixed_cart" | "fixed_product";
};

export type WooCouponRecord = {
  code: string;
  amount: string;
  discount_type: string;
  status: string;
  usage_count?: number;
  usage_limit?: number | null;
  minimum_amount?: string;
  maximum_amount?: string;
  date_expires?: string | null;
};

export function calculateCouponDiscount(
  coupon: CheckoutCoupon | null,
  itemsTotal: number,
): number {
  if (!coupon || itemsTotal <= 0) return 0;

  const amount = Number(coupon.amount) || 0;
  let discount = 0;

  switch (coupon.discount_type) {
    case "percent":
      discount = (itemsTotal * amount) / 100;
      break;
    case "fixed_cart":
    case "fixed_product":
      discount = amount;
      break;
    default:
      discount = 0;
  }

  return Math.min(discount, itemsTotal);
}

export function getCheckoutTotal(
  itemsTotal: number,
  deliveryFee: number,
  discount: number,
): number {
  return Math.max(0, itemsTotal + deliveryFee - discount);
}

export function validateCouponForCheckout(
  coupon: WooCouponRecord,
  itemsTotal: number,
): string | null {
  if (coupon.status !== "publish") {
    return "Coupon is not active";
  }

  if (coupon.date_expires) {
    const expiresAt = new Date(coupon.date_expires);
    if (!Number.isNaN(expiresAt.getTime()) && expiresAt < new Date()) {
      return "Coupon has expired";
    }
  }

  if (
    coupon.usage_limit !== null &&
    coupon.usage_limit !== undefined &&
    (coupon.usage_count ?? 0) >= coupon.usage_limit
  ) {
    return "Coupon usage limit reached";
  }

  const minimum = Number(coupon.minimum_amount) || 0;
  if (minimum > 0 && itemsTotal < minimum) {
    return `Order must be at least KSh ${minimum.toLocaleString()} to use this coupon`;
  }

  const maximum = Number(coupon.maximum_amount) || 0;
  if (maximum > 0 && itemsTotal > maximum) {
    return `This coupon only applies to orders up to KSh ${maximum.toLocaleString()}`;
  }

  if (
    coupon.discount_type !== "percent" &&
    coupon.discount_type !== "fixed_cart" &&
    coupon.discount_type !== "fixed_product"
  ) {
    return "This coupon type is not supported at checkout";
  }

  return null;
}

export function toCheckoutCoupon(coupon: WooCouponRecord): CheckoutCoupon {
  return {
    code: coupon.code,
    amount: coupon.amount,
    discount_type: coupon.discount_type as CheckoutCoupon["discount_type"],
  };
}

export function formatCouponDiscountLabel(coupon: {
  discount_type: string;
  amount: string;
}): string {
  if (coupon.discount_type === "percent") {
    return `${coupon.amount}% off`;
  }

  return `KSh ${Number(coupon.amount).toLocaleString()} off`;
}
