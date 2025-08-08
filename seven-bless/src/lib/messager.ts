import sgMail from "@sendgrid/mail";
import twilio from "twilio";

sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

const twilioClient = (() => {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (sid && token) return twilio(sid, token);
  return null;
})();

export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM) throw new Error("SENDGRID not configured");
  await sgMail.send({
    to,
    from: process.env.SENDGRID_FROM!,
    subject,
    text,
  });
}

export async function sendSMS(to: string, body: string): Promise<void> {
  if (!twilioClient || !process.env.TWILIO_FROM) throw new Error("TWILIO not configured");
  await twilioClient.messages.create({
    from: process.env.TWILIO_FROM!,
    to,
    body,
  });
}