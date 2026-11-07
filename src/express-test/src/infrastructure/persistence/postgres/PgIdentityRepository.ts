import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import type { CredentialRecord, IdentityRepository, RefreshRotationResult } from "../../../domain/identity/IdentityRepository.js";

export class PgIdentityRepository implements IdentityRepository {
  constructor(private readonly pool: Pool) {}

  async findCredentialsByEmail(email: string): Promise<CredentialRecord | null> {
    const result = await this.pool.query<{
      id: string; email: string; passwordHash: string | null; status: CredentialRecord["status"];
    }>(`SELECT id, email, password_hash AS "passwordHash", status
       FROM users WHERE email = $1 AND deleted_at IS NULL LIMIT 1`, [email]);
    return result.rows[0] ?? null;
  }

  async findUserIdByEmail(email: string): Promise<string | null> {
    const result = await this.pool.query<{ id: string }>(`SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL LIMIT 1`, [email]);
    return result.rows[0]?.id ?? null;
  }

  async createUser(email: string, passwordHash: string): Promise<string> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO users (email, email_verified, password_hash) VALUES ($1, FALSE, $2) RETURNING id`, [email, passwordHash],
      );
      const userId = inserted.rows[0]?.id;
      if (!userId) throw new Error("Could not create the MDATE user.");
      const role = await client.query<{ id: number }>(`SELECT id FROM roles WHERE name = 'patient' LIMIT 1`);
      const roleId = role.rows[0]?.id;
      if (roleId === undefined) throw new Error("The patient role is missing. Apply the patient-role seed migration first.");
      await client.query(`INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`, [userId, roleId]);
      await client.query("COMMIT");
      return userId;
    } catch (error) { await client.query("ROLLBACK").catch(() => undefined); throw error; }
    finally { client.release(); }
  }

  async createRefreshSession(input: { userId: string; familyId: string; tokenHash: string; expiresAt: Date }): Promise<void> {
    await this.pool.query(
      `INSERT INTO refresh_sessions (id, user_id, family_id, token_hash, expires_at) VALUES ($1, $2, $3, $4, $5)`,
      [randomUUID(), input.userId, input.familyId, input.tokenHash, input.expiresAt],
    );
  }

  async rotateRefreshSession(input: { oldTokenHash: string; newTokenHash: string; newExpiresAt: Date }): Promise<RefreshRotationResult> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const selected = await client.query<{
        id: string; userId: string; familyId: string; expiresAt: Date; revokedAt: Date | null;
      }>(`SELECT id, user_id AS "userId", family_id AS "familyId", expires_at AS "expiresAt", revoked_at AS "revokedAt"
          FROM refresh_sessions WHERE token_hash = $1 FOR UPDATE`, [input.oldTokenHash]);
      const session = selected.rows[0];
      if (!session) { await client.query("COMMIT"); return { status: "invalid" }; }
      if (session.revokedAt) {
        await client.query(`UPDATE refresh_sessions SET revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP) WHERE family_id = $1`, [session.familyId]);
        await client.query("COMMIT");
        return { status: "reuse" };
      }
      if (new Date(session.expiresAt).getTime() <= Date.now()) {
        await client.query(`UPDATE refresh_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE id = $1`, [session.id]);
        await client.query("COMMIT");
        return { status: "invalid" };
      }
      await client.query(`UPDATE refresh_sessions SET revoked_at = CURRENT_TIMESTAMP, replaced_by_hash = $2 WHERE id = $1`, [session.id, input.newTokenHash]);
      await client.query(
        `INSERT INTO refresh_sessions (id, user_id, family_id, token_hash, expires_at) VALUES ($1, $2, $3, $4, $5)`,
        [randomUUID(), session.userId, session.familyId, input.newTokenHash, input.newExpiresAt],
      );
      await client.query("COMMIT");
      return { status: "rotated", userId: session.userId, sessionId: session.familyId };
    } catch (error) { await client.query("ROLLBACK").catch(() => undefined); throw error; }
    finally { client.release(); }
  }

  async revokeRefreshSession(tokenHash: string): Promise<void> {
    await this.pool.query(`UPDATE refresh_sessions SET revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP) WHERE token_hash = $1`, [tokenHash]);
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.pool.query(`UPDATE refresh_sessions SET revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP) WHERE user_id = $1`, [userId]);
  }

  async createPasswordResetToken(input: { userId: string; tokenHash: string; expiresAt: Date }): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(`UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND used_at IS NULL`, [input.userId]);
      await client.query(`INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) VALUES ($1, $2, $3, $4)`, [randomUUID(), input.userId, input.tokenHash, input.expiresAt]);
      await client.query("COMMIT");
    } catch (error) { await client.query("ROLLBACK").catch(() => undefined); throw error; }
    finally { client.release(); }
  }

  async consumePasswordReset(input: { tokenHash: string; newPasswordHash: string }): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const selected = await client.query<{ id: string; userId: string; expiresAt: Date; usedAt: Date | null }>(
        `SELECT id, user_id AS "userId", expires_at AS "expiresAt", used_at AS "usedAt" FROM password_reset_tokens WHERE token_hash = $1 FOR UPDATE`,
        [input.tokenHash],
      );
      const token = selected.rows[0];
      if (!token || token.usedAt || new Date(token.expiresAt).getTime() <= Date.now()) { await client.query("ROLLBACK"); return false; }
      await client.query(`UPDATE users SET password_hash = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL`, [token.userId, input.newPasswordHash]);
      await client.query(`UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND used_at IS NULL`, [token.userId]);
      await client.query(`UPDATE refresh_sessions SET revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP) WHERE user_id = $1`, [token.userId]);
      await client.query("COMMIT");
      return true;
    } catch (error) { await client.query("ROLLBACK").catch(() => undefined); throw error; }
    finally { client.release(); }
  }
}
