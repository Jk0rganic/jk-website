import { NextResponse } from "next/server";
import { listActiveDeliveryAdminRates } from "@/lib/delivery/admin-delivery-rates";
import {
  type DeliveryMethod,
  resolveDeliveryQuote,
} from "@/lib/delivery/delivery-quote";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const deliveryMethod = parseDeliveryMethod(body.deliveryMethod);
    const adminRates = await listActiveDeliveryAdminRates();
    const quote = resolveDeliveryQuote(
      {
        deliveryMethod,
        county: typeof body.county === "string" ? body.county : undefined,
        cartSubtotal: Number(body.cartSubtotal ?? 0),
      },
      adminRates,
    );

    return NextResponse.json({
      ...quote,
      method: deliveryMethod,
      available: true,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to resolve delivery";
    return NextResponse.json({ message }, { status: 400 });
  }
}

function parseDeliveryMethod(value: unknown): DeliveryMethod {
  if (value === "pickup" || value === "shipping") return value;
  throw new Error("Invalid delivery method");
}
