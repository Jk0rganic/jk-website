"use server";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { type RegisterUserSchema, registerUserSchema } from "@/utils/zod/zod";

export async function registerUserAction(data: RegisterUserSchema) {
  try {
    const parsed = registerUserSchema.safeParse(data);

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      };
    }

    const { full_name, email, password } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return { success: false, error: "Email already in use" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name: full_name,
        email,
        password: hashedPassword,
        role: "user",
        emailVerified: null,
      },
    });

    return { success: true, message: "Account created successfully" };
  } catch (err) {
    console.error("registerUserAction error:", err);
    return { success: false, error: "Server error. Please try again." };
  }
}

export async function validateSignupToken(token: string) {
  if (!token) return { error: "Missing token" };

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const record = await prisma.verificationToken.findFirst({
    where: { token: hashedToken },
  });

  if (!record) return { error: "Invalid token" };

  if (record.expires < new Date()) {
    await prisma.verificationToken.deleteMany({
      where: { identifier: record.identifier },
    });
    return { error: "Token expired" };
  }

  await prisma.verificationToken.deleteMany({
    where: { identifier: record.identifier },
  });

  return { email: record.identifier };
}
