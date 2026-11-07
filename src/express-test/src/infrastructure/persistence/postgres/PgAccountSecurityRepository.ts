import type { Pool } from "pg";
import type {
  AccountSecurityRepository, AccountSessionRecord, EmailChangeResult, UserCredential,
} from "../../../domain/security/AccountSecurityRepository.js";

export class PgAccountSecurityRepository implements AccountSecurityRepository {
  constructor(private readonly pool: Pool) {}

  async findCredentialsByUserId(userId: string): Promise<UserCredential | null> {
    const result = await this.pool.query<UserCredential>(
      `SELECT id, email, password_hash AS "passwordHash" FROM users
       WHERE id = $1 AND deleted_at IS NULL LIMIT 1`, [userId],
    );
    return result.rows[0] ?? null;
  }

  async changePasswordAndRevokeOtherSessions(input: { userId: string; currentSessionId: string; passwordHash: string }): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const updated = await client.query(
        `UPDATE users SET password_hash = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND deleted_at IS NULL`, [input.userId, input.passwordHash],
      );
      if (!updated.rowCount) throw new Error("The account could not be found.");
      await client.query(
        `UPDATE refresh_sessions SET revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP)
         WHERE user_id = $1 AND family_id <> $2`, [input.userId, input.currentSessionId],
      );
      await client.query(
        `UPDATE password_reset_tokens SET used_at = COALESCE(used_at, CURRENT_TIMESTAMP)
         WHERE user_id = $1 AND used_at IS NULL`, [input.userId],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally { client.release(); }
  }

  async createEmailChangeRequest(input: { userId: string; newEmail: string; tokenHash: string; expiresAt: Date }): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE email_change_requests SET used_at = CURRENT_TIMESTAMP
         WHERE used_at IS NULL AND (expires_at <= CURRENT_TIMESTAMP OR user_id = $1)`, [input.userId],
      );
      const occupied = await client.query(
        `SELECT id FROM users WHERE lower(email) = lower($1) AND deleted_at IS NULL AND id <> $2 LIMIT 1 FOR UPDATE`,
        [input.newEmail, input.userId],
      );
      if (occupied.rowCount) throw new Error("This email address is already registered.");
      await client.query(
        `INSERT INTO email_change_requests (user_id, new_email, token_hash, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [input.userId, input.newEmail, input.tokenHash, input.expiresAt],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally { client.release(); }
  }

  async consumeEmailChangeToken(tokenHash: string): Promise<EmailChangeResult | null> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const selected = await client.query<{ id: string; userId: string; newEmail: string; expiresAt: Date; usedAt: Date | null }>(
        `SELECT id, user_id AS "userId", new_email AS "newEmail", expires_at AS "expiresAt", used_at AS "usedAt"
         FROM email_change_requests WHERE token_hash = $1 FOR UPDATE`, [tokenHash],
      );
      const request = selected.rows[0];
      if (!request || request.usedAt || new Date(request.expiresAt).getTime() <= Date.now()) {
        await client.query("ROLLBACK");
        return null;
      }
      const current = await client.query<{ oldEmail: string | null }>(
        `SELECT email AS "oldEmail" FROM users WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`,
        [request.userId],
      );
      if (!current.rows[0]) throw new Error("The account could not be found.");
      const updated = await client.query(
        `UPDATE users SET email = $2, email_verified = TRUE, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND deleted_at IS NULL`, [request.userId, request.newEmail],
      );
      if (!updated.rowCount) throw new Error("The account could not be found.");
      await client.query(
        `UPDATE email_change_requests SET used_at = COALESCE(used_at, CURRENT_TIMESTAMP)
         WHERE user_id = $1 AND used_at IS NULL`, [request.userId],
      );
      await client.query("COMMIT");
      return { userId: request.userId, oldEmail: current.rows[0].oldEmail ?? "", newEmail: request.newEmail };
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally { client.release(); }
  }

  async listActiveSessions(userId: string): Promise<AccountSessionRecord[]> {
    const result = await this.pool.query<AccountSessionRecord>(
      `SELECT family_id AS id,
              MIN(created_at) AS "createdAt",
              MAX(created_at) FILTER (WHERE revoked_at IS NULL) AS "lastActiveAt",
              MAX(expires_at) FILTER (WHERE revoked_at IS NULL) AS "expiresAt"
       FROM refresh_sessions
       WHERE user_id = $1
       GROUP BY family_id
       HAVING BOOL_OR(revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP)
       ORDER BY "lastActiveAt" DESC`, [userId],
    );
    return result.rows.map((row) => ({
      id: row.id,
      createdAt: new Date(row.createdAt).toISOString(),
      lastActiveAt: new Date(row.lastActiveAt).toISOString(),
      expiresAt: new Date(row.expiresAt).toISOString(),
    }));
  }

  async revokeSessionFamily(userId: string, sessionId: string): Promise<void> {
    await this.pool.query(
      `UPDATE refresh_sessions SET revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP)
       WHERE user_id = $1 AND family_id = $2`, [userId, sessionId],
    );
  }

  async revokeOtherSessions(userId: string, currentSessionId: string): Promise<void> {
    await this.pool.query(
      `UPDATE refresh_sessions SET revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP)
       WHERE user_id = $1 AND family_id <> $2`, [userId, currentSessionId],
    );
  }

  async isSessionFamilyActive(userId: string, sessionId: string): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT 1 FROM refresh_sessions
       WHERE user_id = $1 AND family_id = $2 AND revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP
       LIMIT 1`, [userId, sessionId],
    );
    return Boolean(result.rowCount);
  }
}
