import { requireAdminSession } from "@/lib/admin/require-admin";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { error, status } = await requireAdminSession();

  if (error) {
    return Response.json({ error }, { status });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");
  const orderId = searchParams.get("orderId");

  try {
    const payments = await prisma.payment.findMany({
      where: {
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(orderId ? { orderId: Number(orderId) } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return Response.json({ payments });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch payments";
    return Response.json({ error: message }, { status: 500 });
  }
}
