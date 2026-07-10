import prisma from "@/lib/prisma";

function isMissingAdminStatusColumnError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /auth_version|disabled_at|deleted_at/.test(message);
}

export async function getCredentialUser(email: string) {
  if (!email?.trim()) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        authVersion: true,
        disabledAt: true,
        deletedAt: true,
      },
    });

    if (!user) return null;

    if (!user.password) {
      return {
        error:
          "This account uses social login. Please sign in with your social provider.",
      };
    }

    return user;
  } catch (error) {
    if (isMissingAdminStatusColumnError(error)) {
      const [legacyUser] = await prisma.$queryRaw<
        Array<{
          id: string;
          email: string;
          password: string | null;
          name: string;
          role: string | null;
          authVersion: number;
          disabledAt: Date | null;
          deletedAt: Date | null;
        }>
      >`
        select
          id,
          email,
          password,
          name,
          role,
          0 as "authVersion",
          null::timestamp as "disabledAt",
          null::timestamp as "deletedAt"
        from users
        where email = ${email}
        limit 1
      `;

      if (!legacyUser) return null;

      if (!legacyUser.password) {
        return {
          error:
            "This account uses social login. Please sign in with your social provider.",
        };
      }

      return legacyUser;
    }

    console.error("[GET_CREDENTIAL_USER]", error);
    return null;
  }
}
