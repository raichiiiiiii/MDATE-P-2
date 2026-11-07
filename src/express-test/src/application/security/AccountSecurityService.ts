import { createHash, randomBytes } from "node:crypto";
import type { PasswordHasher } from "../../domain/identity/PasswordHasher.js";
import type { AccountSecurityRepository } from "../../domain/security/AccountSecurityRepository.js";
import type { EmailChangeMailer } from "../../domain/security/EmailChangeMailer.js";

export class CurrentPasswordInvalidError extends Error {}
export class PasswordSetupRequiredError extends Error {}
export class InvalidEmailChangeTokenError extends Error {}
export class SessionNotFoundError extends Error {}
export class NewPasswordUnchangedError extends Error {}
export class CurrentEmailUnchangedError extends Error {}

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function assertPassword(password: string): void {
  if (password.length < 12 || Buffer.byteLength(password, "utf8") > 72) {
    throw new Error("Password must contain at least 12 characters and no more than 72 UTF-8 bytes.");
  }
}

export class AccountSecurityService {
  constructor(
    private readonly repository: AccountSecurityRepository,
    private readonly passwords: PasswordHasher,
    private readonly emailMailer: EmailChangeMailer,
    private readonly emailChangeBaseUrl: string,
    private readonly emailChangeTtlMinutes = 30,
  ) {}

  async changePassword(input: { userId: string; currentSessionId: string; currentPassword: string; newPassword: string }): Promise<void> {
    assertPassword(input.newPassword);
    if (input.currentPassword === input.newPassword) throw new NewPasswordUnchangedError("Choose a new password different from your current password.");
    const credentials = await this.repository.findCredentialsByUserId(input.userId);
    if (!credentials?.passwordHash) throw new PasswordSetupRequiredError("Set a password using the password-reset flow before changing it here.");
    if (!await this.passwords.verify(input.currentPassword, credentials.passwordHash)) throw new CurrentPasswordInvalidError("Your current password is incorrect.");
    const passwordHash = await this.passwords.hash(input.newPassword);
    await this.repository.changePasswordAndRevokeOtherSessions({ userId: input.userId, currentSessionId: input.currentSessionId, passwordHash });
  }

  async requestEmailChange(input: { userId: string; currentPassword: string; newEmail: string }): Promise<void> {
    const email = normalizeEmail(input.newEmail);
    const credentials = await this.repository.findCredentialsByUserId(input.userId);
    if (!credentials?.passwordHash) throw new PasswordSetupRequiredError("Set a password using the password-reset flow before changing your email.");
    if (!await this.passwords.verify(input.currentPassword, credentials.passwordHash)) throw new CurrentPasswordInvalidError("Your current password is incorrect.");
    if (credentials.email?.toLowerCase() === email) throw new CurrentEmailUnchangedError("This is already your current email address.");
    const token = randomBytes(32).toString("base64url");
    await this.repository.createEmailChangeRequest({
      userId: input.userId,
      newEmail: email,
      tokenHash: digest(token),
      expiresAt: new Date(Date.now() + this.emailChangeTtlMinutes * 60 * 1000),
    });
    const url = new URL(this.emailChangeBaseUrl);
    url.searchParams.set("token", token);
    await this.emailMailer.sendVerification(email, url.toString());
  }

  async confirmEmailChange(token: string): Promise<void> {
    const result = await this.repository.consumeEmailChangeToken(digest(token));
    if (!result) throw new InvalidEmailChangeTokenError("This email verification link is invalid, expired or already used.");
    try {
      await this.emailMailer.notifyChanged(result.oldEmail, result.newEmail);
    } catch (error) {
      console.error("[MDATE] Email-change notification could not be sent:", error);
    }
  }

  listSessions(userId: string) {
    return this.repository.listActiveSessions(userId);
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const sessions = await this.repository.listActiveSessions(userId);
    if (!sessions.some((session) => session.id === sessionId)) throw new SessionNotFoundError("The session was not found or has already expired.");
    await this.repository.revokeSessionFamily(userId, sessionId);
  }

  revokeOtherSessions(userId: string, currentSessionId: string): Promise<void> {
    return this.repository.revokeOtherSessions(userId, currentSessionId);
  }

  isSessionActive(userId: string, sessionId: string): Promise<boolean> {
    return this.repository.isSessionFamilyActive(userId, sessionId);
  }
}
