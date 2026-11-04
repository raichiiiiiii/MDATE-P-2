import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { AccountRepository } from "../../domain/identity/AccountRepository.js";
import type { IdentityRepository } from "../../domain/identity/IdentityRepository.js";
import type { PasswordHasher } from "../../domain/identity/PasswordHasher.js";
import type { AccessTokenService } from "../../domain/identity/AccessTokenService.js";
import type { PasswordResetMailer } from "../../domain/identity/PasswordResetMailer.js";
import type { IdentitySettings } from "../../domain/identity/IdentitySettings.js";

export class InvalidCredentialsError extends Error {}
export class AccountUnavailableError extends Error {}
export class InvalidRefreshTokenError extends Error {}
export class InvalidPasswordResetTokenError extends Error {}

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function assertPasswordLength(password: string): void {
  if (Buffer.byteLength(password, "utf8") > 72) {
    throw new Error("Password must not exceed 72 UTF-8 bytes when using bcrypt.");
  }
}

export class IdentityService {
  constructor(
    private readonly identities: IdentityRepository,
    private readonly accounts: AccountRepository,
    private readonly passwords: PasswordHasher,
    private readonly accessTokens: AccessTokenService,
    private readonly resetMailer: PasswordResetMailer,
    private readonly settings: IdentitySettings,
  ) {}

  private async issueSession(userId: string, roles: string[]) {
    const refreshToken = randomBytes(32).toString("base64url");
    const familyId = randomUUID();
    await this.identities.createRefreshSession({
      userId,
      familyId,
      tokenHash: digest(refreshToken),
      expiresAt: new Date(Date.now() + this.settings.refreshTokenTtlDays * 24 * 60 * 60 * 1000),
    });
    return {
      accessToken: await this.accessTokens.sign({ userId, roles }),
      refreshToken,
    };
  }

  async register(emailInput: string, password: string) {
    assertPasswordLength(password);
    const email = normalizeEmail(emailInput);
    const passwordHash = await this.passwords.hash(password);
    const userId = await this.identities.createUser(email, passwordHash);
    const account = await this.accounts.findById(userId);
    if (!account) throw new Error("The new MDATE account could not be loaded.");
    if (account.status === "SUSPENDED" || account.status === "DELETED") {
      throw new AccountUnavailableError();
    }
    return { ...(await this.issueSession(userId, account.roles)), account };
  }

  async login(emailInput: string, password: string) {
    const email = normalizeEmail(emailInput);
    const credentials = await this.identities.findCredentialsByEmail(email);
    if (!credentials?.passwordHash) throw new InvalidCredentialsError();
    const valid = await this.passwords.verify(password, credentials.passwordHash);
    if (!valid) throw new InvalidCredentialsError();
    if (credentials.status === "SUSPENDED" || credentials.status === "DELETED") {
      throw new AccountUnavailableError();
    }
    const account = await this.accounts.findById(credentials.id);
    if (!account) throw new InvalidCredentialsError();
    return { ...(await this.issueSession(credentials.id, account.roles)), account };
  }

  async refresh(rawRefreshToken: string) {
    const newRefreshToken = randomBytes(32).toString("base64url");
    const rotated = await this.identities.rotateRefreshSession({
      oldTokenHash: digest(rawRefreshToken),
      newTokenHash: digest(newRefreshToken),
      newExpiresAt: new Date(Date.now() + this.settings.refreshTokenTtlDays * 24 * 60 * 60 * 1000),
    });
    if (rotated.status !== "rotated") throw new InvalidRefreshTokenError();
    const account = await this.accounts.findById(rotated.userId);
    if (!account || account.status === "SUSPENDED" || account.status === "DELETED") {
      await this.identities.revokeAllUserSessions(rotated.userId);
      throw new AccountUnavailableError();
    }
    return {
      accessToken: await this.accessTokens.sign({ userId: rotated.userId, roles: account.roles }),
      refreshToken: newRefreshToken,
      account,
    };
  }

  async logout(rawRefreshToken: string | null): Promise<void> {
    if (rawRefreshToken) await this.identities.revokeRefreshSession(digest(rawRefreshToken));
  }

  async requestPasswordReset(emailInput: string): Promise<void> {
    const email = normalizeEmail(emailInput);
    const userId = await this.identities.findUserIdByEmail(email);
    if (!userId) return;
    const token = randomBytes(32).toString("base64url");
    await this.identities.createPasswordResetToken({
      userId,
      tokenHash: digest(token),
      expiresAt: new Date(Date.now() + this.settings.passwordResetTtlMinutes * 60 * 1000),
    });
    const url = new URL(this.settings.passwordResetBaseUrl);
    url.searchParams.set("token", token);
    await this.resetMailer.send(email, url.toString());
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    assertPasswordLength(newPassword);
    const success = await this.identities.consumePasswordReset({
      tokenHash: digest(token),
      newPasswordHash: await this.passwords.hash(newPassword),
    });
    if (!success) throw new InvalidPasswordResetTokenError();
  }
}
