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
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      return token;
    },

    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }

      return session;
    },

    async signIn({ user, account }: { user?: any; account?: any }) {
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

          return true;
        }

        if (!account) {
          return false;
        }

        const newUser = await createUserAndLinkAccount(user, account);

        user.id = newUser.id;
        user.role = newUser.role;

        return true;
      } catch (error) {
        console.error("[AUTH_SIGNIN_ERROR]", error);

        return false;
      }
    },
  },

  providers: [],
};
