import { getSession } from "@/lib/auth/getSession";

export async function GET() {
  try {
    const session = await getSession();
    return Response.json({ user: session?.user || null });
  } catch (error) {
    return Response.json({ user: null });
  }
}
