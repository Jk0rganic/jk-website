"use server";
import nodemailer from "nodemailer";

const transport = {
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT),
  secure: Boolean(Number(process.env.SMTP_SECURE)),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

export async function connectedToNodemailer() {
  try {
    const transporter = nodemailer.createTransport(transport);

    await transporter.verify();

    return transporter;
  } catch (error) {
    console.error("Failed to connect to Nodemailer:", error);
    throw new Error("Nodemailer connection error");
  }
}
