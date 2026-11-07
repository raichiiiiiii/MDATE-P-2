import type { Pool } from "pg";
import type { AvatarUploadIntent, ProfileRepository } from "../../../domain/profile/ProfileRepository.js";

export class PgProfileRepository implements ProfileRepository {
  constructor(private readonly pool: Pool) {}

  async findAvatar(userId: string) {
    const result = await this.pool.query<{
      storageKey: string | null; contentType: string | null; updatedAt: Date | null;
    }>(
      `SELECT avatar_storage_key AS "storageKey", avatar_content_type AS "contentType",
              avatar_updated_at AS "updatedAt"
       FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [userId],
    );
    const row = result.rows[0];
    return row ? {
      storageKey: row.storageKey,
      contentType: row.contentType,
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : null,
    } : null;
  }

  async updateDisplayName(userId: string, displayName: string): Promise<void> {
    const result = await this.pool.query(
      `UPDATE users SET display_name = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND deleted_at IS NULL`,
      [userId, displayName],
    );
    if (!result.rowCount) throw new Error("The account could not be found.");
  }

  async createAvatarUploadIntent(input: {
    id: string; userId: string; objectKey: string; contentType: string;
    expectedSizeBytes: number; expiresAt: Date;
  }): Promise<void> {
    await this.pool.query(
      `INSERT INTO avatar_upload_intents
         (id, user_id, object_key, content_type, expected_size_bytes, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [input.id, input.userId, input.objectKey, input.contentType, input.expectedSizeBytes, input.expiresAt],
    );
  }

  async findAvatarUploadIntent(id: string, userId: string): Promise<AvatarUploadIntent | null> {
    const result = await this.pool.query<{
      id: string; userId: string; objectKey: string; contentType: string;
      expectedSizeBytes: number; expiresAt: Date; usedAt: Date | null;
    }>(
      `SELECT id, user_id AS "userId", object_key AS "objectKey", content_type AS "contentType",
              expected_size_bytes AS "expectedSizeBytes", expires_at AS "expiresAt", used_at AS "usedAt"
       FROM avatar_upload_intents WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );
    const row = result.rows[0];
    return row ? {
      id: row.id, userId: row.userId, objectKey: row.objectKey, contentType: row.contentType,
      expectedSizeBytes: row.expectedSizeBytes, expiresAt: new Date(row.expiresAt).toISOString(),
      usedAt: row.usedAt ? new Date(row.usedAt).toISOString() : null,
    } : null;
  }

  async activateAvatar(input: { uploadIntentId: string; userId: string; contentType: string }): Promise<string | null> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const selected = await client.query<{
        objectKey: string; contentType: string; expiresAt: Date; usedAt: Date | null;
      }>(
        `SELECT object_key AS "objectKey", content_type AS "contentType", expires_at AS "expiresAt", used_at AS "usedAt"
         FROM avatar_upload_intents WHERE id = $1 AND user_id = $2 FOR UPDATE`,
        [input.uploadIntentId, input.userId],
      );
      const intent = selected.rows[0];
      if (!intent || intent.usedAt || new Date(intent.expiresAt).getTime() <= Date.now() || intent.contentType !== input.contentType) {
        throw new Error("The avatar upload intent is invalid or expired.");
      }
      const current = await client.query<{ oldKey: string | null }>(
        `SELECT avatar_storage_key AS "oldKey" FROM users WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`,
        [input.userId],
      );
      if (!current.rows[0]) throw new Error("The account could not be found.");
      await client.query(
        `UPDATE users SET avatar_storage_key = $2, avatar_content_type = $3,
             avatar_updated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [input.userId, intent.objectKey, input.contentType],
      );
      await client.query(
        `UPDATE avatar_upload_intents SET used_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2`,
        [input.uploadIntentId, input.userId],
      );
      await client.query("COMMIT");
      return current.rows[0].oldKey;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally { client.release(); }
  }

  async removeAvatar(userId: string): Promise<string | null> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const selected = await client.query<{ oldKey: string | null }>(
        `SELECT avatar_storage_key AS "oldKey" FROM users WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`,
        [userId],
      );
      if (!selected.rows[0]) throw new Error("The account could not be found.");
      await client.query(
        `UPDATE users SET avatar_storage_key = NULL, avatar_content_type = NULL,
             avatar_updated_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [userId],
      );
      await client.query("COMMIT");
      return selected.rows[0].oldKey;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally { client.release(); }
  }

  async invalidateAvatarUploadIntent(id: string, userId: string): Promise<void> {
    await this.pool.query(
      `UPDATE avatar_upload_intents SET used_at = COALESCE(used_at, CURRENT_TIMESTAMP)
       WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );
  }
}
