import { requireAdminSession } from "@/lib/admin/require-admin";
import {
  formValuesToWooCouponPayload,
  mapWooCoupon,
  type WooCoupon,
} from "@/lib/admin/coupon-service";
import { couponFormSchema } from "@/lib/admin/coupon-schema";
import { fetchWoo } from "@/lib/fetch/fetchRest";

const MAX_PAGES = 5;
const PER_PAGE = 100;

export async function GET() {
  const { error, status } = await requireAdminSession();

  if (error) {
    return Response.json({ error }, { status });
  }

  try {
    const coupons: ReturnType<typeof mapWooCoupon>[] = [];

    for (let page = 1; page <= MAX_PAGES; page++) {
      const batch = await fetchWoo<WooCoupon[]>(
        `coupons?per_page=${PER_PAGE}&page=${page}`,
        { noCache: true },
      );

      if (!batch.length) break;

      coupons.push(...batch.map(mapWooCoupon));

      if (batch.length < PER_PAGE) break;
    }

    return Response.json({ coupons });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch coupons";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error, status } = await requireAdminSession();

  if (error) {
    return Response.json({ error }, { status });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = couponFormSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid coupon data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const coupon = await fetchWoo<WooCoupon>("coupons", {
      method: "POST",
      body: formValuesToWooCouponPayload(parsed.data),
      noCache: true,
    });

    return Response.json({ coupon: mapWooCoupon(coupon) }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create coupon";
    return Response.json({ error: message }, { status: 500 });
  }
}
