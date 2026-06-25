import { describe, expect, it } from "vitest";
import {
  calculateCouponDiscount,
  getCheckoutTotal,
  validateCouponForCheckout,
} from "@/lib/checkout/coupon";
import { couponFormSchema } from "./coupon-schema";
import {
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
      expiresAt: "2026-12-31",
    });

    expect(payload).toEqual({
      code: "SAVE20",
      discount_type: "percent",
      amount: "20",
      description: "Launch promo",
      status: "publish",
      individual_use: false,
      usage_limit: 100,
      minimum_amount: "500",
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
      status: "publish",
      individual_use: false,
      minimum_amount: "0",
    });

    expect(coupon.discountLabel).toBe("10% off");
    expect(coupon.active).toBe(true);
    expect(summarizeCoupons([coupon]).active).toBe(1);
  });
});
