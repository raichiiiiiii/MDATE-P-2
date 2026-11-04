import type { Pool, PoolClient, QueryResultRow } from "pg";
import type { AccountSnapshot, AccountSetupInput } from "../../../domain/identity/Account.js";
import type { AccountRepository } from "../../../domain/identity/AccountRepository.js";

type Executor = Pool | PoolClient;
type AccountRow = QueryResultRow & {
  id: string; email: string | null; emailVerified: boolean; displayName: string | null;
  preferredLanguage: string; status: AccountSnapshot["status"]; setupCompletedAt: Date | null;
  createdAt: Date; updatedAt: Date; roles: string[] | null;
  textSize: AccountSnapshot["accessibilityPreferences"]["textSize"];
  contrast: AccountSnapshot["accessibilityPreferences"]["contrast"];
  alternativeInputOn: boolean; preferredVoiceId: string | null;
  audioRate: string | number; audioVolume: string | number; voiceDisabled: boolean;
};

const ACCOUNT_BY_ID_SQL = `
  SELECT u.id, u.email, u.email_verified AS "emailVerified",
    u.display_name AS "displayName", u.preferred_language AS "preferredLanguage",
    u.status, u.setup_completed_at AS "setupCompletedAt",
    u.created_at AS "createdAt", u.updated_at AS "updatedAt",
    COALESCE((SELECT json_agg(r.name ORDER BY r.name)
      FROM user_roles ur JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = u.id), '[]'::json) AS roles,
    COALESCE(ap.text_size, 'medium') AS "textSize",
    COALESCE(ap.contrast, 'normal') AS contrast,
    COALESCE(ap.alternative_input_on, FALSE) AS "alternativeInputOn",
    vp.preferred_voice_id AS "preferredVoiceId",
    COALESCE(vp.audio_rate, 1.00) AS "audioRate",
    COALESCE(vp.audio_volume, 1.00) AS "audioVolume",
    COALESCE(vp.voice_disabled, FALSE) AS "voiceDisabled"
  FROM users u
  LEFT JOIN accessibility_preferences ap ON ap.user_id = u.id
  LEFT JOIN voice_preferences vp ON vp.user_id = u.id
  WHERE u.id = $1 AND u.deleted_at IS NULL LIMIT 1`;

function toSnapshot(row: AccountRow): AccountSnapshot {
  return {
    id: row.id,
    email: row.email,
    emailVerified: row.emailVerified,
    displayName: row.displayName,
    preferredLanguage: row.preferredLanguage,
    status: row.status,
    setupCompletedAt: row.setupCompletedAt ? new Date(row.setupCompletedAt).toISOString() : null,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
    roles: row.roles ?? [],
    accessibilityPreferences: {
      textSize: row.textSize,
      contrast: row.contrast,
      alternativeInputOn: row.alternativeInputOn,
    },
    voicePreferences: {
      preferredVoiceId: row.preferredVoiceId,
      audioRate: Number(row.audioRate),
      audioVolume: Number(row.audioVolume),
      voiceDisabled: row.voiceDisabled,
    },
  };
}

async function selectAccount(db: Executor, userId: string): Promise<AccountSnapshot | null> {
  const result = await db.query<AccountRow>(ACCOUNT_BY_ID_SQL, [userId]);
  return result.rows[0] ? toSnapshot(result.rows[0]) : null;
}

export class PgAccountRepository implements AccountRepository {
  constructor(private readonly pool: Pool) {}

  async findById(userId: string): Promise<AccountSnapshot | null> {
    return selectAccount(this.pool, userId);
  }

  async completeSetup(userId: string, input: AccountSetupInput): Promise<AccountSnapshot | null> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const updated = await client.query<{ id: string }>(
        `UPDATE users SET display_name = $2, preferred_language = $3,
           status = 'ACTIVE', setup_completed_at = COALESCE(setup_completed_at, CURRENT_TIMESTAMP),
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND status IN ('PENDING_SETUP', 'ACTIVE') AND deleted_at IS NULL
         RETURNING id`,
        [userId, input.displayName, input.preferredLanguage],
      );
      if (!updated.rows[0]) {
        await client.query("ROLLBACK");
        return null;
      }
      await client.query(
        `INSERT INTO accessibility_preferences
           (user_id, text_size, contrast, alternative_input_on, updated_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id) DO UPDATE SET
           text_size = EXCLUDED.text_size, contrast = EXCLUDED.contrast,
           alternative_input_on = EXCLUDED.alternative_input_on,
           updated_at = CURRENT_TIMESTAMP`,
        [userId, input.accessibilityPreferences.textSize, input.accessibilityPreferences.contrast,
          input.accessibilityPreferences.alternativeInputOn],
      );
      await client.query(
        `INSERT INTO voice_preferences
           (user_id, preferred_voice_id, audio_rate, audio_volume, voice_disabled, updated_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id) DO UPDATE SET
           preferred_voice_id = EXCLUDED.preferred_voice_id, audio_rate = EXCLUDED.audio_rate,
           audio_volume = EXCLUDED.audio_volume, voice_disabled = EXCLUDED.voice_disabled,
           updated_at = CURRENT_TIMESTAMP`,
        [userId, input.voicePreferences.preferredVoiceId, input.voicePreferences.audioRate,
          input.voicePreferences.audioVolume, input.voicePreferences.voiceDisabled],
      );
      const account = await selectAccount(client, userId);
      if (!account) throw new Error("Could not retrieve the updated MDATE account.");
      await client.query("COMMIT");
      return account;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }
}
