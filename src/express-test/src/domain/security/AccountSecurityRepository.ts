export interface UserCredential {
  id: string;
  email: string | null;
  passwordHash: string | null;
}

export interface AccountSessionRecord {
  id: string;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
}

export interface EmailChangeResult {
  userId: string;
  oldEmail: string;
  newEmail: string;
}

export interface AccountSecurityRepository {
  findCredentialsByUserId(userId: string): Promise<UserCredential | null>;
  changePasswordAndRevokeOtherSessions(input: {
    userId: string;
    currentSessionId: string;
    passwordHash: string;
  }): Promise<void>;
  createEmailChangeRequest(input: {
    userId: string;
    newEmail: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void>;
  consumeEmailChangeToken(tokenHash: string): Promise<EmailChangeResult | null>;
  listActiveSessions(userId: string): Promise<AccountSessionRecord[]>;
  revokeSessionFamily(userId: string, sessionId: string): Promise<void>;
  revokeOtherSessions(userId: string, currentSessionId: string): Promise<void>;
  isSessionFamilyActive(userId: string, sessionId: string): Promise<boolean>;
}
