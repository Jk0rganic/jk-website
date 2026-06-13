// app/components/ProtectedRoute.jsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/getSession";

export default async function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const user = session?.user;

  if (!user) {
    redirect("/signin"); // redirect if not logged in
  }

  return children;
}
