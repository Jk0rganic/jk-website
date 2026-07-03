import { describe, expect, it } from "vitest";
import {
  calculateCouponDiscount,
  getCheckoutTotal,
  validateCouponForCheckout,
} from "@/lib/checkout/coupon";
import { couponFormSchema } from "./coupon-schema";
import {
  couponToFormValues,
  formValuesToWooCouponPayload,
  mapWooCoupon,
  summarizeCoupons,
} from "./coupon-service";

describe("calculateCouponDiscount", () => {
  it("calculates percent discounts", () => {
    const discount = calculateCouponDiscount(
      { code: "SAVE10", amount: "10", discount_type: "percent" },
      2000,
    );

    expect(discount).toBe(200);
  });

  it("calculates fixed cart discounts", () => {
    const discount = calculateCouponDiscount(
      { code: "FLAT500", amount: "500", discount_type: "fixed_cart" },
      2000,
    );

    expect(discount).toBe(500);
  });

  it("never exceeds items total", () => {
    const discount = calculateCouponDiscount(
      { code: "BIG", amount: "1000", discount_type: "fixed_cart" },
      300,
    );

    expect(discount).toBe(300);
  });
});

describe("getCheckoutTotal", () => {
  it("subtracts discount and adds delivery", () => {
    expect(getCheckoutTotal(2000, 160, 200)).toBe(1960);
  });
});

describe("validateCouponForCheckout", () => {
  it("rejects inactive coupons", () => {
    expect(
      validateCouponForCheckout(
        {
          code: "OFF",
          amount: "10",
          discount_type: "percent",
          status: "draft",
        },
        1000,
      ),
    ).toBe("Coupon is not active");
  });

  it("enforces minimum order amount", () => {
    expect(
      validateCouponForCheckout(
        {
          code: "OFF",
          amount: "10",
          discount_type: "percent",
          status: "publish",
          minimum_amount: "1500",
        },
        1000,
      ),
    ).toContain("at least");
  });
});

describe("couponFormSchema", () => {
  it("accepts valid coupon input", () => {
    const result = couponFormSchema.safeParse({
      code: "welcome10",
      discountType: "percent",
      amount: "10",
      published: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.code).toBe("WELCOME10");
    }
  });

  it("accepts WooCommerce coupon restriction fields", () => {
    const result = couponFormSchema.safeParse({
      code: "welcome10",
      discountType: "percent",
      amount: "10",
      published: true,
      maximumAmount: "2500",
      usageLimitPerUser: "1",
      individualUse: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.maximumAmount).toBe("2500");
      expect(result.data.usageLimitPerUser).toBe("1");
      expect(result.data.individualUse).toBe(true);
    }
  });
});

describe("formValuesToWooCouponPayload", () => {
  it("maps admin form values to WooCommerce coupon fields", () => {
    const payload = formValuesToWooCouponPayload({
      code: "SAVE20",
      discountType: "percent",
      amount: "20",
      description: "Launch promo",
      published: true,
      usageLimit: "100",
      minimumAmount: "500",
      maximumAmount: "2500",
      usageLimitPerUser: "1",
      individualUse: true,
      expiresAt: "2026-12-31",
    });

    expect(payload).toEqual({
      code: "SAVE20",
      discount_type: "percent",
      amount: "20",
      description: "Launch promo",
      status: "publish",
      individual_use: true,
      usage_limit: 100,
      usage_limit_per_user: 1,
      minimum_amount: "500",
      maximum_amount: "2500",
      date_expires: "2026-12-31T23:59:59",
    });
  });
});

describe("mapWooCoupon", () => {
  it("maps WooCommerce coupons for admin display", () => {
    const coupon = mapWooCoupon({
      id: 4,
      code: "WELCOME10",
      amount: "10",
      discount_type: "percent",
      description: "Welcome offer",
      date_expires: null,
      usage_count: 2,
      usage_limit: 50,
      usage_limit_per_user: 2,
      status: "publish",
      individual_use: true,
      minimum_amount: "0",
      maximum_amount: "5000",
    });

    expect(coupon.discountLabel).toBe("10% off");
    expect(coupon.active).toBe(true);
    expect(coupon.maximumAmount).toBe("5000");
    expect(coupon.usageLimitPerUser).toBe("2");
    expect(coupon.individualUse).toBe(true);
    expect(summarizeCoupons([coupon]).active).toBe(1);
  });

  it("maps restriction fields back to edit form values", () => {
    const formValues = couponToFormValues({
      id: 4,
      code: "WELCOME10",
      amount: "10",
      discountType: "percent",
      discountLabel: "10% off",
      description: "Welcome offer",
      expiresAt: null,
      usageCount: 2,
      usageLimit: 50,
      active: true,
      minimumAmount: "0",
      maximumAmount: "5000",
      usageLimitPerUser: "2",
      individualUse: true,
    });

    expect(formValues.maximumAmount).toBe("5000");
    expect(formValues.usageLimitPerUser).toBe("2");
    expect(formValues.individualUse).toBe(true);
  });
});
