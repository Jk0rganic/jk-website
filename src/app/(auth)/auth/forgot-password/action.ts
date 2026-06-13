"use server";

import prisma from "@/lib/prisma";
import { getCredentialUser } from "@/lib/auth/action/getUserWithAccounts";

import nodemailer from "nodemailer";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const RESET_TOKEN_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

interface ActionResponse {
  success: boolean;
  message: string;
}

interface ResetPasswordInput {
  token: string;
  password: string;
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
): Promise<ActionResponse> {
  try {
    const user = await getCredentialUser(email);

    if (!user) {
      return {
        success: false,
        message: "No account found with this email.",
      };
    }

    if ("error" in user) {
      return {
        success: false,
        message: user.error,
      };
    }

    const rawToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = hashToken(rawToken);

    const expires = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

    await prisma.verificationToken.deleteMany({
      where: {
        identifier: email,
      },
    });

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: hashedToken,
        expires,
      },
    });

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/forgot-password?token=${rawToken}`;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;text-align:center">
        <h2>Password Reset</h2>

        <p>
          We received a request to reset your password.
        </p>

        <a
          href="${resetLink}"
          style="
            display:inline-block;
            padding:12px 24px;
            background:#4CAF50;
            color:white;
            text-decoration:none;
            border-radius:6px;
          "
        >
          Reset Password
        </a>

        <p style="margin-top:20px">
          If you did not request this, please ignore this email.
        </p>

        <p style="font-size:12px;color:#666">
          This link expires in 10 minutes.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset Your Password",
      html,
    });

    return {
      success: true,
      message: "Password reset email sent successfully.",
    };
  } catch (error) {
    console.error("[SEND_RESET_EMAIL]", error);

    return {
      success: false,
      message: "Failed to send reset email.",
    };
  }
}

/**
 * Reset password
 */
export async function resetPassword({
  token,
  password,
}: ResetPasswordInput): Promise<ActionResponse> {
  try {
    const hashedToken = hashToken(token);

    const record = await prisma.verificationToken.findFirst({
      where: {
        token: hashedToken,
      },
    });

    if (!record || record.expires < new Date()) {
      return {
        success: false,
        message: "Invalid or expired token.",
      };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: {
          email: record.identifier,
        },
        data: {
          password: hashedPassword,
        },
      }),

      prisma.verificationToken.deleteMany({
        where: {
          identifier: record.identifier,
        },
      }),
    ]);

    return {
      success: true,
      message: "Password reset successfully.",
    };
  } catch (error) {
    console.error("[RESET_PASSWORD]", error);

    return {
      success: false,
      message: "Failed to reset password.",
    };
  }
}

/**
 * Validate reset token
 */
export async function validateResetToken(token: string): Promise<boolean> {
  try {
    if (!token) {
      return false;
    }

    const record = await prisma.verificationToken.findFirst({
      where: {
        token: hashToken(token),
      },
    });

    return Boolean(record && record.expires > new Date());
  } catch (error) {
    console.error("[VALIDATE_RESET_TOKEN]", error);

    return false;
  }
}
