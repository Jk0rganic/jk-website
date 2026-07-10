import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { WooCoupon } from "@/lib/admin/coupon-service";
import {
  calculateCouponDiscount,
  toCheckoutCoupon,
  validateCouponForCheckout,
} from "@/lib/checkout/coupon";
import { fetchWoo } from "@/lib/fetch/fetchRest";

const requestSchema = z.object({
  code: z.string().trim().min(1),
  itemsTotal: z.number().min(0),
});

export async function POST(req: NextRequest) {
  try {
    const body = requestSchema.parse(await req.json());
    const code = body.code.toUpperCase();

    const coupons = await fetchWoo<WooCoupon[]>(
      `coupons?code=${encodeURIComponent(code)}`,
      { noCache: true },
    );

    const coupon = coupons?.[0];

    if (!coupon) {
      return NextResponse.json(
        { error: "Invalid coupon code" },
        { status: 404 },
      );
    }

    const validationError = validateCouponForCheckout(coupon, body.itemsTotal);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const checkoutCoupon = toCheckoutCoupon(coupon);
    const discount = calculateCouponDiscount(checkoutCoupon, body.itemsTotal);

    return NextResponse.json({
      coupon: checkoutCoupon,
      discount,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to apply coupon";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
