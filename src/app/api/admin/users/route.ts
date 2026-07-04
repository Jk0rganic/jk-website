import bcrypt from "bcryptjs";
import { createAdminSchema } from "@/lib/admin/admin-user-schema";
import { mapAdminUser } from "@/lib/admin/admin-user-service";
import { requireSuperAdminSession } from "@/lib/admin/require-admin";
import { ADMIN_ROLE, SUPER_ADMIN_ROLE } from "@/lib/admin/roles";
import prisma from "@/lib/prisma";

const adminUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  disabledAt: true,
  deletedAt: true,
} as const;

const activeSuperAdminWhere = {
  role: SUPER_ADMIN_ROLE,
  disabledAt: null,
  deletedAt: null,
} as const;

export async function GET() {
  const { error, status, session } = await requireSuperAdminSession();

  if (error || !session) {
    return Response.json({ error }, { status });
  }

  try {
    const [users, superAdminCount] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: { in: [ADMIN_ROLE, SUPER_ADMIN_ROLE] },
          deletedAt: null,
        },
        select: adminUserSelect,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where: activeSuperAdminWhere }),
    ]);

    return Response.json({
      users: users.map((user: (typeof users)[number]) =>
        mapAdminUser(user, session.user.id, superAdminCount, session.user.role),
      ),
    });
  } catch (err) {
    console.error("[ADMIN_USERS_GET_ERROR]", err);
    return Response.json(
      { error: "Failed to fetch admin users" },
      { status: 500 },
    );
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
      if (existingUser.deletedAt) {
        return Response.json(
          { error: "This email belongs to an inactive account" },
          { status: 409 },
        );
      }

      if (
        existingUser.role === ADMIN_ROLE ||
        existingUser.role === SUPER_ADMIN_ROLE
      ) {
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
          disabledAt: null,
          deletedAt: null,
        },
        select: adminUserSelect,
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
        disabledAt: null,
        deletedAt: null,
      },
      select: adminUserSelect,
    });

    return Response.json({ user }, { status: 201 });
  } catch (err) {
    console.error("[ADMIN_USERS_POST_ERROR]", err);
    return Response.json({ error: "Failed to create admin" }, { status: 500 });
  }
}
