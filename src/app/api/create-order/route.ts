import { type NextRequest, NextResponse } from "next/server";
import { listActiveDeliveryAdminRates } from "@/lib/delivery/admin-delivery-rates";
import { resolveDeliveryQuote } from "@/lib/delivery/delivery-quote";
import { createOrder } from "@/lib/fetch/createOrder";
import { notifyStaffOfNewOrder } from "@/lib/notifications/notify-new-order";

interface OrderBody {
  billing?: { state?: string };
  shipping?: { state?: string };
  line_items?: Array<{ total?: unknown }>;
  shipping_lines?: Array<{
    method_id?: string;
    method_title?: string;
    total?: string;
  }>;
  meta_data?: Array<{ key?: string; value?: unknown }>;
  [key: string]: unknown;
}

function getMetaValue(
  metaData: Array<{ key?: string; value?: unknown }> | undefined,
  key: string,
) {
  const value = metaData?.find((item) => item.key === key)?.value;
  return typeof value === "string" ? value : undefined;
}

function getCartSubtotal(lineItems: Array<{ total?: unknown }> | undefined) {
  return (lineItems ?? []).reduce((sum, item) => {
    const total = Number(item.total);
    return Number.isFinite(total) ? sum + total : sum;
  }, 0);
}

async function enforceDeliveryQuote(body: OrderBody) {
  const shippingLine = body.shipping_lines?.[0];
  const isPickup = shippingLine?.method_id === "local_pickup";
  const deliveryType = getMetaValue(body.meta_data, "_delivery_type");

  if (isPickup || deliveryType === "pickup") {
    return {
      ...body,
      shipping_lines: [
        {
          ...(shippingLine ?? {}),
          method_id: "local_pickup",
          method_title: shippingLine?.method_title ?? "Local Pickup",
          total: "0.00",
        },
      ],
    };
  }

  const adminRates = await listActiveDeliveryAdminRates();
  const county =
    getMetaValue(body.meta_data, "_county") ??
    body.shipping?.state ??
    body.billing?.state;
  const quote = resolveDeliveryQuote(
    {
      deliveryMethod: "shipping",
      county,
      cartSubtotal: getCartSubtotal(body.line_items),
    },
    adminRates,
  );

  return {
    ...body,
    shipping_lines: [
      {
        ...(shippingLine ?? {}),
        method_id: "flat_rate",
        method_title: quote.label,
        total: Number(quote.fee).toFixed(2),
      },
    ],
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const enforcedBody = await enforceDeliveryQuote(body);
    const order = await createOrder(enforcedBody);

    try {
      await notifyStaffOfNewOrder(order as WooOrderResponse);
    } catch (error) {
      console.error("[NEW_ORDER_NOTIFICATION_ERROR]", error);
    }

    return NextResponse.json(order);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create order";
    return NextResponse.json({ message }, { status: 500 });
  }
}
