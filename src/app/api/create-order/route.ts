import { NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/fetch/createOrder";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const order = await createOrder(body);

    return NextResponse.json(order);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create order";
    return NextResponse.json({ message }, { status: 500 });
  }
}