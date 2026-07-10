import { couponFormSchema } from "@/lib/admin/coupon-schema";
import {
  couponToFormValues,
  formValuesToWooCouponPayload,
  mapWooCoupon,
  type WooCoupon,
} from "@/lib/admin/coupon-service";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { fetchWoo } from "@/lib/fetch/fetchRest";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { error, status } = await requireAdminSession();

  if (error) {
    return Response.json({ error }, { status });
  }

  const { id } = await params;
  const couponId = Number(id);

  if (!Number.isFinite(couponId)) {
    return Response.json({ error: "Invalid coupon id" }, { status: 400 });
  }

  try {
    const wooCoupon = await fetchWoo<WooCoupon>(`coupons/${couponId}`, {
      noCache: true,
    });
    const coupon = mapWooCoupon(wooCoupon);

    return Response.json({
      coupon,
      formValues: couponToFormValues(coupon),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch coupon";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { error, status } = await requireAdminSession();

  if (error) {
    return Response.json({ error }, { status });
  }

  const { id } = await params;
  const couponId = Number(id);

  if (!Number.isFinite(couponId)) {
    return Response.json({ error: "Invalid coupon id" }, { status: 400 });
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
    const coupon = await fetchWoo<WooCoupon>(`coupons/${couponId}`, {
      method: "PUT",
      body: formValuesToWooCouponPayload(parsed.data),
      noCache: true,
    });

    return Response.json({ coupon: mapWooCoupon(coupon) });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update coupon";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { error, status } = await requireAdminSession();

  if (error) {
    return Response.json({ error }, { status });
  }

  const { id } = await params;
  const couponId = Number(id);

  if (!Number.isFinite(couponId)) {
    return Response.json({ error: "Invalid coupon id" }, { status: 400 });
  }

  try {
    await fetchWoo(`coupons/${couponId}?force=true`, {
      method: "DELETE",
      noCache: true,
    });

    return Response.json({ success: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete coupon";
    return Response.json({ error: message }, { status: 500 });
  }
}
