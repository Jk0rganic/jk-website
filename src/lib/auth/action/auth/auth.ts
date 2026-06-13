import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "./auth.config";
import { getCredentialUser } from "../getUserWithAccounts";
import { handleLoginAttempt } from "../action";
import { CustomPrismaAdapter } from "./custom-adapter";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  adapter: CustomPrismaAdapter(),
  secret: process.env.AUTH_SECRET,

  ...authConfig,

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  callbacks: {
    ...authConfig.callbacks,

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role;
      }
      return session;
    },
  },

  providers: [
    Google({
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),

    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        const email = credentials?.email?.toString();
        const password = credentials?.password?.toString();

        if (!email || !password) return null;

        const user = await getCredentialUser(email);

        if (!user) return null;

        if ("error" in user) throw new Error(user.error);

        const loginResult = await handleLoginAttempt(user, password);

        if (!loginResult.success) throw new Error(loginResult.message);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
});