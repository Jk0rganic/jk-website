import type { NextAuthConfig } from "next-auth";
import {
  createUserAndLinkAccount,
  findUserByEmail,
  linkAccountToUser,
} from "../action";

export const authConfig = {
  pages: {
    error: "/auth/error",
    resetPassword: "/auth/reset-password",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.authVersion = user.authVersion;
        token.disabledAt = user.disabledAt;
        token.deletedAt = user.deletedAt;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role;
        session.user.authVersion = token.authVersion;
        session.user.disabledAt = token.disabledAt;
        session.user.deletedAt = token.deletedAt;
      }

      return session;
    },

    async signIn({ user, account }) {
      try {
        if (!user?.email) {
          return false;
        }

        const existingUser = await findUserByEmail(user.email);

        if (existingUser) {
          if (account) {
            await linkAccountToUser(existingUser.id, account);
          }

          user.id = existingUser.id;
          user.role = existingUser.role;
          user.authVersion = existingUser.authVersion;
          user.disabledAt = existingUser.disabledAt;
          user.deletedAt = existingUser.deletedAt;

          return true;
        }

        if (!account) {
          return false;
        }

        const newUser = await createUserAndLinkAccount(
          { ...user, email: user.email },
          account,
        );

        user.id = newUser.id;
        user.role = newUser.role;
        user.authVersion = newUser.authVersion;
        user.disabledAt = newUser.disabledAt;
        user.deletedAt = newUser.deletedAt;

        return true;
      } catch (error) {
        console.error("[AUTH_SIGNIN_ERROR]", error);

        return false;
      }
    },
  },

  providers: [],
} satisfies Omit<NextAuthConfig, "pages"> & {
  pages: NextAuthConfig["pages"] & { resetPassword: string };
};
