import nodemailer from "nodemailer";
import type { EmailChangeMailer } from "../../domain/security/EmailChangeMailer.js";
import { env } from "../../shared/configuration/env.js";

export class SmtpEmailChangeMailer implements EmailChangeMailer {
  private async send(to: string, subject: string, text: string, html: string): Promise<void> {
    if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD || !env.MAIL_FROM) {
      if (env.NODE_ENV === "development") {
        console.info(`[MDATE email notice] ${to}: ${text}`);
        return;
      }
      throw new Error("Email delivery is not configured.");
    }
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST, port: env.SMTP_PORT, secure: env.SMTP_SECURE,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    });
    await transporter.sendMail({ from: env.MAIL_FROM, to, subject, text, html });
  }

  sendVerification(email: string, verificationUrl: string): Promise<void> {
    return this.send(
      email,
      "Verify your new MDATE email address",
      `A request was made to use this address for an MDATE account. Verify it within 30 minutes: ${verificationUrl}\n\nIf you did not request this, ignore this message.`,
      `<p>A request was made to use this address for an MDATE account.</p><p><a href="${verificationUrl}">Verify this email address</a></p><p>The link expires in 30 minutes.</p>`,
    );
  }

  notifyChanged(oldEmail: string, newEmail: string): Promise<void> {
    return this.send(
      oldEmail,
      "Your MDATE email address was changed",
      `The email address on your MDATE account was changed to ${newEmail}. If you did not make this change, contact MDATE support.`,
      `<p>The email address on your MDATE account was changed to <strong>${newEmail}</strong>.</p><p>If you did not make this change, contact MDATE support.</p>`,
    );
  }
}
