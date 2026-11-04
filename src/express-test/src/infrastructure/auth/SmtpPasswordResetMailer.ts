import nodemailer from "nodemailer";
import type { PasswordResetMailer } from "../../domain/identity/PasswordResetMailer.js";
import { env } from "../../shared/configuration/env.js";

export class SmtpPasswordResetMailer implements PasswordResetMailer {
  async send(email: string, resetUrl: string): Promise<void> {
    if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD || !env.MAIL_FROM) {
      if (env.NODE_ENV === "development") {
        console.info(`[MDATE password reset] Development link for ${email}: ${resetUrl}`);
        return;
      }
      throw new Error("Password reset email delivery is not configured.");
    }
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    });
    await transporter.sendMail({
      from: env.MAIL_FROM,
      to: email,
      subject: "Reset your MDATE password",
      text: `A password reset was requested for your MDATE account. Open this link within 15 minutes: ${resetUrl}\n\nIf you did not request this, ignore this email.`,
      html: `<p>A password reset was requested for your MDATE account.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in 15 minutes. If you did not request this, ignore this email.</p>`,
    });
  }
}
