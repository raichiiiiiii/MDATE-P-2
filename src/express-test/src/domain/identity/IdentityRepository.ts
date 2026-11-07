export interface CredentialRecord {
  id: string;
  email: string;
  passwordHash: string | null;
  status: "PENDING_SETUP" | "ACTIVE" | "SUSPENDED" | "DELETED";
}

export type RefreshRotationResult =
  | { status: "rotated"; userId: string; sessionId: string }
  | { status: "invalid" }
  | { status: "reuse" };

export interface IdentityRepository {
  findCredentialsByEmail(email: string): Promise<CredentialRecord | null>;
  findUserIdByEmail(email: string): Promise<string | null>;
  createUser(email: string, passwordHash: string): Promise<string>;
  createRefreshSession(input: { userId: string; familyId: string; tokenHash: string; expiresAt: Date }): Promise<void>;
  rotateRefreshSession(input: { oldTokenHash: string; newTokenHash: string; newExpiresAt: Date }): Promise<RefreshRotationResult>;
  revokeRefreshSession(tokenHash: string): Promise<void>;
  revokeAllUserSessions(userId: string): Promise<void>;
  createPasswordResetToken(input: { userId: string; tokenHash: string; expiresAt: Date }): Promise<void>;
  consumePasswordReset(input: { tokenHash: string; newPasswordHash: string }): Promise<boolean>;
}
