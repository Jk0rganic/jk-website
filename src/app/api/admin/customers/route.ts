import { fetchAdminCustomers } from "@/lib/admin/customer-service";
import { requireAdminSession } from "@/lib/admin/require-admin";

export async function GET() {
  const { error, status } = await requireAdminSession();
  if (error) return Response.json({ error }, { status });
  try {
    return Response.json(await fetchAdminCustomers());
  } catch (error) {
    console.error("Failed to fetch admin customers", error);
    return Response.json(
      { error: "Failed to fetch customers" },
      { status: 500 },
    );
  }
}
