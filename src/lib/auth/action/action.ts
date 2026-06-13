"use server";

import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

const MAX_LOGIN_ATTEMPTS = 4;
const LOCKOUT_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

interface OAuthUser {
  email: string;
  name?: string | null;
}

interface OAuthAccount {
  type: string;
  provider: string;
  providerAccountId: string;
  access_token?: string | null;
  token_type?: string | null;
  expires_at?: number | null;
  refresh_token?: string | null;
}

interface LoginResult {
  success: boolean;
  message: string;
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

/**
 * Link OAuth account to user
 */
export async function linkAccountToUser(userId: string, account: OAuthAccount) {
  return prisma.account.upsert({
    where: {
      provider_providerAccountId: {
        provider: account.provider,
        providerAccountId: account.providerAccountId,
      },
    },
    update: {},
    create: {
      userId,
      type: account.type,
      provider: account.provider,
      providerAccountId: account.providerAccountId,
      access_token: account.access_token,
      token_type: account.token_type,
      expires_at: account.expires_at,
      refresh_token: account.refresh_token,
    },
  });
}

/**
 * Create user and link OAuth account
 */
export async function createUserAndLinkAccount(
  user: OAuthUser,
  account: OAuthAccount,
) {
  return prisma.$transaction(async (tx: any) => {
    const newUser = await tx.user.create({
      data: {
        email: user.email,
        name: user.name ?? "",
        emailVerified: new Date(),
      },
    });

    await tx.account.create({
      data: {
        userId: newUser.id,
        type: account.type,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        access_token: account.access_token,
        token_type: account.token_type,
        expires_at: account.expires_at,
        refresh_token: account.refresh_token,
      },
    });

    return newUser;
  });
}

/**
 * Handle login attempts and lockouts
 */
export async function handleLoginAttempt(
  user: {
    id: string;
    password: string | null;
  },
  password: string,
): Promise<LoginResult> {
  const now = new Date();

  let attempt = await prisma.loginAttempt.findUnique({
    where: {
      userId: user.id,
    },
  });

  if (!attempt) {
    attempt = await prisma.loginAttempt.create({
      data: {
        userId: user.id,
      },
    });
  }

  if (attempt.lockoutUntil && attempt.lockoutUntil > now) {
    const minutesLeft = Math.ceil(
      (attempt.lockoutUntil.getTime() - now.getTime()) / 60000,
    );

    return {
      success: false,
      message: `Too many attempts. Try again in ${minutesLeft} minute(s).`,
    };
  }

  const isValidPassword = await bcrypt.compare(password, user.password ?? "");

  if (!isValidPassword) {
    const failedAttempts = attempt.count + 1;

    const shouldLock = failedAttempts >= MAX_LOGIN_ATTEMPTS;

    await prisma.loginAttempt.update({
      where: {
        userId: user.id,
      },
      data: {
        count: shouldLock ? 0 : failedAttempts,
        lockoutUntil: shouldLock
          ? new Date(Date.now() + LOCKOUT_DURATION_MS)
          : null,
      },
    });

    return {
      success: false,
      message: shouldLock
        ? "Too many attempts. Account locked for 2 hours."
        : `Invalid credentials. ${
            MAX_LOGIN_ATTEMPTS - failedAttempts
          } attempt(s) remaining.`,
    };
  }

  await prisma.loginAttempt.update({
    where: {
      userId: user.id,
    },
    data: {
      count: 0,
      lockoutUntil: null,
    },
  });

  return {
    success: true,
    message: "Login successful!",
  };
}
