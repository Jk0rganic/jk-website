import { requireSuperAdminSession } from "@/lib/admin/require-admin";
import { mapAdminUser } from "@/lib/admin/admin-user-service";
import { ADMIN_ROLE, SUPER_ADMIN_ROLE } from "@/lib/admin/roles";
import prisma from "@/lib/prisma";
import { createAdminSchema } from "@/lib/admin/admin-user-schema";
import bcrypt from "bcryptjs";

export async function GET() {
  const { error, status, session } = await requireSuperAdminSession();

  if (error || !session) {
    return Response.json({ error }, { status });
  }

  try {
    const [users, superAdminCount] = await Promise.all([
      prisma.user.findMany({
        where: { role: { in: [ADMIN_ROLE, SUPER_ADMIN_ROLE] } },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where: { role: SUPER_ADMIN_ROLE } }),
    ]);

    return Response.json({
      users: users.map((user: (typeof users)[number]) =>
        mapAdminUser(user, session.user.id, superAdminCount),
      ),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch admin users";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error, status } = await requireSuperAdminSession();

  if (error) {
    return Response.json({ error }, { status });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createAdminSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid admin data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      if (existingUser.role === ADMIN_ROLE || existingUser.role === SUPER_ADMIN_ROLE) {
        return Response.json(
          { error: "This email already belongs to an admin" },
          { status: 409 },
        );
      }

      const updated = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name,
          role: ADMIN_ROLE,
          password: await bcrypt.hash(password, 10),
          emailVerified: new Date(),
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      return Response.json({ user: updated, promoted: true }, { status: 200 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: ADMIN_ROLE,
        emailVerified: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return Response.json({ user }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create admin";
    return Response.json({ error: message }, { status: 500 });
  }
}
