import { connectedToNodemailer } from "./connectedToNodemailer";

interface EmailParams {
  recipient: string;
  subject: string;
  body: string;
  replyTo?: string;
  from?: string;
}

export async function sendEmail({
  recipient,
  subject,
  body,
  replyTo = "no-reply@jkorganics.co.ke",
  from = process.env.EMAIL_FROM,
}: EmailParams) {
  if (!recipient || !subject || !body)
    throw new Error(
      "Missing required email fields: recipient, subject, or body",
    );

  const transporter = await connectedToNodemailer();

  await transporter.sendMail({
    from,
    to: recipient,
    subject,
    html: body,
    replyTo,
  });
}
