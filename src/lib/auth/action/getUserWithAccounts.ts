import prisma from "@/lib/prisma";

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
    console.error("[GET_CREDENTIAL_USER]", error);
    return null;
  }
}
