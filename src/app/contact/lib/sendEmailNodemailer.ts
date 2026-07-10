"use server";

import { sendEmail } from "@/lib/nodemailer/send-mail";
import { contactFormSchema } from "@/utils/zod/zod";

interface ContactEmailInput {
  name: string;
  email: string;
  message: string;
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function contactEmailTemplate({ name, email, message }: ContactEmailInput) {
  return `
    <h2>New Contact Message</h2>

    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>

    <p><strong>Message:</strong></p>
    <p>${escapeHtml(message)}</p>
  `;
}

export async function sendEmailNodemailer(data: unknown) {
  const validatedData = contactFormSchema.safeParse(data);

  if (!validatedData.success) {
    return {
      success: false,
      message: "Invalid form data",
      errors: validatedData.error.flatten().fieldErrors,
    };
  }

  const { name, email, subject, message } = validatedData.data;

  try {
    await sendEmail({
      recipient: process.env.SMTP_USER!,
      from: process.env.SMTP_USER!, // safer for SMTP providers
      replyTo: email,
      subject: subject
        ? `${subject} — from ${email}`
        : `New Contact Message — from ${email}`,
      body: contactEmailTemplate({ name, email, message }),
    });

    return { success: true };
  } catch (error) {
    console.error("Email send error:", error);

    return {
      success: false,
      message: "Failed to send message.",
    };
  }
}
