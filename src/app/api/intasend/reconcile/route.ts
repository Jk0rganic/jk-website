import { type NextRequest, NextResponse } from "next/server";
import { reconcilePendingPayments } from "@/lib/intasend/reconcile-pending-payments";

function isAuthorized(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;

  const authHeader = req.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await reconcilePendingPayments();
    return NextResponse.json(summary);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Reconciliation failed";
    return NextResponse.json({ message }, { status: 500 });
  }
}
