import {
  createUserAndLinkAccount,
  findUserByEmail,
  linkAccountToUser,
} from "../action";

type AdminStatusValue = Date | string | null | undefined;

type AuthCallbackUser = {
  id?: string;
  email?: string | null;
  role?: string;
  disabledAt?: AdminStatusValue;
  deletedAt?: AdminStatusValue;
};

type AuthCallbackToken = {
  id?: string;
  role?: string;
  disabledAt?: AdminStatusValue;
  deletedAt?: AdminStatusValue;
};

type AuthCallbackSession = {
  user?: AuthCallbackUser;
};

type AuthCallbackAccount = {
  type: string;
  provider: string;
  providerAccountId: string;
  access_token?: string | null;
  token_type?: string | null;
  expires_at?: number | null;
  refresh_token?: string | null;
};

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
    async jwt({
      token,
      user,
    }: {
      token: AuthCallbackToken;
      user?: AuthCallbackUser;
    }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.disabledAt = user.disabledAt;
        token.deletedAt = user.deletedAt;
      }

      return token;
    },

    async session({
      session,
      token,
    }: {
      session: AuthCallbackSession;
      token: AuthCallbackToken;
    }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.disabledAt = token.disabledAt;
        session.user.deletedAt = token.deletedAt;
      }

      return session;
    },

    async signIn({
      user,
      account,
    }: {
      user?: AuthCallbackUser;
      account?: AuthCallbackAccount;
    }) {
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
          user.disabledAt = existingUser.disabledAt;
          user.deletedAt = existingUser.deletedAt;

          return true;
        }

        if (!account) {
          return false;
        }

        const newUser = await createUserAndLinkAccount(user, account);

        user.id = newUser.id;
        user.role = newUser.role;
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
};
