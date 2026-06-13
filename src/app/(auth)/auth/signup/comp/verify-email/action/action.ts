"use server";

import { sendEmail } from "@/lib/nodemailer/send-mail";
import prisma from "@/lib/prisma";
import {
  emailVerificationSchema,
  type EmailVerificationSchema,
  registerUserSchema,
  type RegisterUserSchema,
} from "@/utils/zod/zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const htmlTemplate = (token: string, tokenLink: string, email: string) => `
<div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #fafafa; text-align: center;">
  <img src="https://ik.imagekit.io/azdzm62ucs/Ahava%20graphics/JK%20new%20tag%20line%20%20Logo%20(1)%201.png?updatedAt=1760535415162" alt="Logo" style="max-width: 200px; margin-bottom: 20px;" />
  <h2 style="color: #4CAF50;">Your Verification Code</h2>
  <p>Your code is:</p>
  <h2 style="letter-spacing: 2px; background: #f4f4f4; padding: 10px 20px; border-radius: 6px; display: inline-block;">${token}</h2>
  <p style="margin-top: 20px;">Or click below:</p>
  <a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/signup?token=${tokenLink}&email=${encodeURIComponent(email)}" style="display:inline-block;margin-top:10px;padding:10px 20px;background:#4CAF50;color:#fff;border-radius:6px;text-decoration:none;">
    Verify Account
  </a>
  <p style="margin-top: 20px;">Expires in 10 minutes.</p>
</div>
`;

function generateOtp() {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
  return { otp, hashedOtp };
}

export async function sendCodeAction(data: EmailVerificationSchema) {
  const parsed = emailVerificationSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, message: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  const { email } = parsed.data;
  const { otp, hashedOtp } = generateOtp();
  const tokenLink = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 10 * 60 * 1000);

  try {
    await prisma.verificationToken.deleteMany({ where: { identifier: email } });

    await prisma.verificationToken.create({
      data: { identifier: email, token: hashedOtp, tokenLink, expires },
    });

    await sendEmail({
      recipient: email,
      subject: "Your Verification Code",
      body: htmlTemplate(otp, tokenLink, email),
    });

    return { success: true, message: "Verification code sent" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to send verification code" };
  }
}

export async function verifyCodeAction(data: { email: string; token: string }) {
  const { email, token } = data;

  if (!email || !token) {
    return { success: false, message: "Email and code required" };
  }

  const hashedInput = crypto.createHash("sha256").update(token).digest("hex");

  try {
    const record = await prisma.verificationToken.findFirst({
      where: { identifier: email, OR: [{ token: hashedInput }, { tokenLink: token }] },
    });

    if (!record) return { success: false, message: "Invalid code" };

    if (record.expires < new Date()) {
      await prisma.verificationToken.deleteMany({ where: { identifier: email } });
      return { success: false, message: "Code expired" };
    }

    await prisma.verificationToken.deleteMany({ where: { identifier: email } });

    return { success: true, verifiedEmail: email };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Verification failed" };
  }
}

export async function registerUserAction(data: RegisterUserSchema) {
  const parsed = registerUserSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  const { full_name, email, password } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) return { success: false, error: "Email already in use" };

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: { name: full_name, email, password: hashedPassword, role: "user", emailVerified: null },
    });

    return { success: true, message: "Account created successfully" };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Server error. Please try again." };
  }
}

export async function validateSignupToken(tokenLink: string) {
  if (!tokenLink) return { isValid: false, email: null };

  try {
    const record = await prisma.verificationToken.findFirst({ where: { tokenLink } });

    if (!record) return { isValid: false, email: null };

    if (record.expires < new Date()) {
      await prisma.verificationToken.deleteMany({ where: { identifier: record.identifier } });
      return { isValid: false, email: null };
    }

    await prisma.verificationToken.deleteMany({ where: { identifier: record.identifier } });

    return { isValid: true, email: record.identifier };
  } catch (error) {
    console.error(error);
    return { isValid: false, email: null };
  }
}